import type { EnergyInterval } from "../calculations/types";
import { EnphaseAuthError, refreshAccessToken } from "./oauth";
import type {
  EnphaseCredentials,
  EnphaseRgmStatsResponse,
  EnphaseSummary,
  EnphaseSystem,
  EnphaseTelemetryResponse,
} from "./types";

/**
 * Client for the Enphase Enlighten API v4 (https://developer-v4.enphase.com).
 * Field names below follow the public v4 spec as documented; verify against
 * your own system's responses once real credentials are wired in — Enphase
 * has historically changed shapes between API versions.
 */

const API_BASE = "https://api.enphaseenergy.com/api/v4";

export { EnphaseAuthError };

export type TokenRefreshHandler = (creds: EnphaseCredentials) => Promise<void>;

export class EnphaseClient {
  constructor(
    private creds: EnphaseCredentials,
    private onTokenRefreshed: TokenRefreshHandler
  ) {}

  private async ensureFreshToken(): Promise<void> {
    const nowSec = Math.floor(Date.now() / 1000);
    if (this.creds.expiresAt - nowSec > 60) return;

    const result = await refreshAccessToken(this.creds);
    this.creds = {
      ...this.creds,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
    };
    await this.onTokenRefreshed(this.creds);
  }

  private async request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    await this.ensureFreshToken();

    const url = new URL(`${API_BASE}${path}`);
    url.searchParams.set("key", this.creds.apiKey);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${this.creds.accessToken}` },
    });

    if (res.status === 401) {
      throw new EnphaseAuthError("Enphase API rejected the access token.");
    }
    if (!res.ok) {
      throw new Error(`Enphase API error ${res.status}: ${await res.text()}`);
    }
    return res.json();
  }

  listSystems(): Promise<{ systems: EnphaseSystem[] }> {
    return this.request("/systems");
  }

  getSummary(systemId: string): Promise<EnphaseSummary> {
    return this.request(`/systems/${systemId}/summary`);
  }

  /**
   * Revenue-grade meter stats: 15-min intervals with signed average power
   * (negative `powr` = net export). Used when a system has a single net
   * (production + consumption combined) meter.
   */
  getRgmStats(systemId: string, startAt: number, endAt: number): Promise<EnphaseRgmStatsResponse> {
    return this.request(`/systems/${systemId}/rgm_stats`, {
      start_at: String(startAt),
      end_at: String(endAt),
    });
  }

  /** 15-min production telemetry — used together with consumption telemetry on systems with separate meters. */
  getProductionMeterTelemetry(systemId: string, startAt: number, endAt: number): Promise<EnphaseTelemetryResponse> {
    return this.request(`/systems/${systemId}/telemetry/production_meter`, {
      start_at: String(startAt),
      end_at: String(endAt),
    });
  }

  /** 15-min consumption telemetry — requires a consumption CT installed on the system. */
  getConsumptionMeterTelemetry(systemId: string, startAt: number, endAt: number): Promise<EnphaseTelemetryResponse> {
    return this.request(`/systems/${systemId}/telemetry/consumption_meter`, {
      start_at: String(startAt),
      end_at: String(endAt),
    });
  }
}

/** Converts a raw rgm_stats response (single net meter) into normalized EnergyInterval shape. */
export function toEnergyIntervals(response: EnphaseRgmStatsResponse): EnergyInterval[] {
  const intervals: EnergyInterval[] = [];
  for (const meter of response.meter_intervals) {
    for (const point of meter.intervals) {
      const netKwh = point.enwh / 1000;
      const importKwh = netKwh < 0 ? -netKwh : 0;
      const exportKwh = netKwh > 0 ? netKwh : 0;
      intervals.push({
        timestamp: new Date(point.end_at * 1000).toISOString(),
        durationHours: 0.25,
        productionKwh: 0,
        consumptionKwh: 0,
        gridImportKwh: importKwh,
        gridExportKwh: exportKwh,
      });
    }
  }
  return intervals;
}

/**
 * Zips separate production and consumption telemetry (systems with two
 * meters) into full EnergyInterval[], deriving grid import/export as the
 * difference between the two. Points are matched by `end_at`; a timestamp
 * present in only one series is skipped rather than guessed.
 */
export function mergeProductionConsumption(
  production: EnphaseTelemetryResponse,
  consumption: EnphaseTelemetryResponse
): EnergyInterval[] {
  const consumptionByTime = new Map(consumption.intervals.map((p) => [p.end_at, p]));
  const intervals: EnergyInterval[] = [];

  for (const prod of production.intervals) {
    const cons = consumptionByTime.get(prod.end_at);
    if (!cons) continue;

    const productionKwh = prod.enwh / 1000;
    const consumptionKwh = cons.enwh / 1000;

    intervals.push({
      timestamp: new Date(prod.end_at * 1000).toISOString(),
      durationHours: 0.25,
      productionKwh,
      consumptionKwh,
      gridImportKwh: Math.max(0, consumptionKwh - productionKwh),
      gridExportKwh: Math.max(0, productionKwh - consumptionKwh),
    });
  }

  return intervals.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/**
 * Fetches one time range as normalized EnergyInterval[], preferring the
 * separate production+consumption meters (full detail) and falling back to
 * the combined net (rgm_stats) meter for systems without a consumption CT.
 */
export async function fetchEnergyIntervals(
  client: EnphaseClient,
  systemId: string,
  startAt: number,
  endAt: number
): Promise<EnergyInterval[]> {
  try {
    const [production, consumption] = await Promise.all([
      client.getProductionMeterTelemetry(systemId, startAt, endAt),
      client.getConsumptionMeterTelemetry(systemId, startAt, endAt),
    ]);
    return mergeProductionConsumption(production, consumption);
  } catch {
    const rgm = await client.getRgmStats(systemId, startAt, endAt);
    return toEnergyIntervals(rgm);
  }
}
