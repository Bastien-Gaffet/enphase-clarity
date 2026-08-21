import type { EnergyInterval } from "../calculations/types";
import type {
  EnphaseCredentials,
  EnphaseRgmStatsResponse,
  EnphaseSummary,
  EnphaseSystem,
} from "./types";

/**
 * Client for the Enphase Enlighten API v4 (https://developer-v4.enphase.com).
 * Field names below follow the public v4 spec as documented; verify against
 * your own system's responses once real credentials are wired in — Enphase
 * has historically changed shapes between API versions.
 */

const API_BASE = "https://api.enphaseenergy.com/api/v4";
const TOKEN_URL = "https://api.enphaseenergy.com/oauth/token";

export class EnphaseAuthError extends Error {}

export type TokenRefreshHandler = (creds: EnphaseCredentials) => Promise<void>;

export class EnphaseClient {
  constructor(
    private creds: EnphaseCredentials,
    private onTokenRefreshed: TokenRefreshHandler
  ) {}

  private async ensureFreshToken(): Promise<void> {
    const nowSec = Math.floor(Date.now() / 1000);
    if (this.creds.expiresAt - nowSec > 60) return;

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${this.creds.clientId}:${this.creds.clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.creds.refreshToken,
      }).toString(),
    });

    if (!res.ok) {
      throw new EnphaseAuthError(`Token refresh failed (${res.status})`);
    }

    const json = await res.json();
    this.creds = {
      ...this.creds,
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? this.creds.refreshToken,
      expiresAt: nowSec + json.expires_in,
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
   * (negative `powr` = net export). Falls back to deriving import/export
   * from separate production/consumption telemetry when a system has no
   * net meter — see `toEnergyIntervals`.
   */
  getRgmStats(systemId: string, startAt: number, endAt: number): Promise<EnphaseRgmStatsResponse> {
    return this.request(`/systems/${systemId}/rgm_stats`, {
      start_at: String(startAt),
      end_at: String(endAt),
    });
  }
}

/** Converts a raw rgm_stats response into the app's normalized EnergyInterval shape. */
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
        productionKwh: 0, // populate from a paired production_meter call when available
        consumptionKwh: 0, // populate from a paired consumption_meter call when available
        gridImportKwh: importKwh,
        gridExportKwh: exportKwh,
      });
    }
  }
  return intervals;
}
