/** Time-of-use window, e.g. { start: "22:30", end: "06:30" } — wraps midnight if start > end. */
export interface TouWindow {
  start: string;
  end: string;
}

export interface TariffConfig {
  /** €/kWh paid during heures pleines */
  hpPricePerKwh: number;
  /** €/kWh paid during heures creuses */
  hcPricePerKwh: number;
  /** One or more heures-creuses windows (EDF contracts often split HC into two ranges). */
  hcWindows: TouWindow[];
  /** Monthly subscription (abonnement), €/month — informational, not part of per-kWh savings. */
  subscriptionMonthlyEUR: number;
  /** €/kWh received for exported surplus (rachat de surplus). */
  surplusSellPricePerKwh: number;
}

export interface SolarInvestment {
  /** Total price of the installation, €. */
  totalPriceEUR: number;
  /** If financed: monthly payment, € (0 if paid upfront). */
  monthlyPaymentEUR: number;
  /** Loan term in months (0 if paid upfront / not financed). */
  loanTermMonths: number;
  /** Date the installation went live (ISO date string). */
  commissionedOn: string;
}

export interface EnergyInterval {
  /** ISO timestamp for the start of this interval. */
  timestamp: string;
  /** Duration of the interval in hours (e.g. 0.25 for 15-min data). */
  durationHours: number;
  productionKwh: number;
  consumptionKwh: number;
  /** kWh drawn from the grid this interval. */
  gridImportKwh: number;
  /** kWh sent back to the grid this interval. */
  gridExportKwh: number;
}
