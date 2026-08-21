export interface EnphaseCredentials {
  apiKey: string;
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  /** Unix seconds. */
  expiresAt: number;
  systemId: string;
}

export interface EnphaseSystem {
  system_id: number;
  name: string;
  status: string;
  timezone: string;
}

export interface EnphaseSummary {
  system_id: number;
  current_power: number; // watts
  energy_today: number; // watt-hours
  energy_lifetime: number; // watt-hours
  status: "normal" | "micro" | "power" | string;
  last_report_at: number; // unix seconds
  modules: number;
  size_w: number;
}

/** One row from GET /systems/{id}/rgm_stats — revenue-grade meter, 15-min intervals. */
export interface EnphaseRgmInterval {
  end_at: number; // unix seconds
  devices_reporting: number;
  powr: number; // average power, watts (signed: negative = export on net meters)
  enwh: number; // energy for the interval, watt-hours
}

export interface EnphaseRgmStatsResponse {
  system_id: number;
  meter_intervals: {
    meter_serial_number: string;
    intervals: EnphaseRgmInterval[];
  }[];
}

/** Shape of GET /systems/{id}/telemetry/production_meter and /telemetry/consumption_meter. */
export interface EnphaseTelemetryResponse {
  system_id: number;
  granularity: string;
  total_devices: number;
  start_date: string;
  intervals: EnphaseRgmInterval[];
}
