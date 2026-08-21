import type { SolarInvestment } from "./types";

export interface PaybackProgress {
  totalInvestmentEUR: number;
  cumulativeSavingsEUR: number;
  amountRemainingEUR: number;
  percentComplete: number;
  /** null if avgMonthlySavingsEUR <= 0 — no projection possible. */
  estimatedMonthsRemaining: number | null;
  estimatedPaidOffDate: string | null;
  monthsSinceCommissioning: number;
}

/**
 * Tracks amortization against total install price, independent of financing.
 * If the install is financed, monthlyPayment/loanTerm only change monthly cash flow,
 * not the true payback point — that's still totalPrice vs cumulative savings.
 */
export function computePaybackProgress(
  investment: SolarInvestment,
  cumulativeSavingsEUR: number,
  avgMonthlySavingsEUR: number,
  now: Date = new Date()
): PaybackProgress {
  const commissioned = new Date(investment.commissionedOn);
  const monthsSinceCommissioning = Math.max(
    0,
    (now.getFullYear() - commissioned.getFullYear()) * 12 + (now.getMonth() - commissioned.getMonth())
  );

  const amountRemainingEUR = Math.max(0, investment.totalPriceEUR - cumulativeSavingsEUR);
  const percentComplete =
    investment.totalPriceEUR > 0
      ? Math.min(1, cumulativeSavingsEUR / investment.totalPriceEUR)
      : 0;

  let estimatedMonthsRemaining: number | null = null;
  let estimatedPaidOffDate: string | null = null;
  if (avgMonthlySavingsEUR > 0 && amountRemainingEUR > 0) {
    estimatedMonthsRemaining = Math.ceil(amountRemainingEUR / avgMonthlySavingsEUR);
    const eta = new Date(now);
    eta.setMonth(eta.getMonth() + estimatedMonthsRemaining);
    estimatedPaidOffDate = eta.toISOString();
  } else if (amountRemainingEUR <= 0) {
    estimatedMonthsRemaining = 0;
    estimatedPaidOffDate = now.toISOString();
  }

  return {
    totalInvestmentEUR: investment.totalPriceEUR,
    cumulativeSavingsEUR,
    amountRemainingEUR,
    percentComplete,
    estimatedMonthsRemaining,
    estimatedPaidOffDate,
    monthsSinceCommissioning,
  };
}

/** Net monthly cash flow while a loan is active: savings minus the mensualité. */
export function netMonthlyCashFlow(investment: SolarInvestment, avgMonthlySavingsEUR: number): number {
  return avgMonthlySavingsEUR - investment.monthlyPaymentEUR;
}
