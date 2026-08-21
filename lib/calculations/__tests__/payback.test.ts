import { computePaybackProgress, netMonthlyCashFlow } from "../payback";
import type { SolarInvestment } from "../types";

const investment: SolarInvestment = {
  totalPriceEUR: 10000,
  monthlyPaymentEUR: 80,
  loanTermMonths: 120,
  commissionedOn: new Date(2024, 0, 1).toISOString(),
};

describe("computePaybackProgress", () => {
  it("computes remaining amount and projects a payoff date from the monthly rate", () => {
    const now = new Date(2025, 0, 1); // exactly 1 year after commissioning
    const result = computePaybackProgress(investment, 4000, 200, now);

    expect(result.amountRemainingEUR).toBe(6000);
    expect(result.percentComplete).toBeCloseTo(0.4, 5);
    expect(result.estimatedMonthsRemaining).toBe(Math.ceil(6000 / 200));
    expect(result.monthsSinceCommissioning).toBe(12);
    expect(result.estimatedPaidOffDate).not.toBeNull();
  });

  it("clamps percentComplete at 1 and reports zero months remaining once paid off", () => {
    const now = new Date(2026, 0, 1);
    const result = computePaybackProgress(investment, 15000, 300, now);

    expect(result.percentComplete).toBe(1);
    expect(result.amountRemainingEUR).toBe(0);
    expect(result.estimatedMonthsRemaining).toBe(0);
  });

  it("returns null projection when there is no positive monthly savings rate", () => {
    const now = new Date(2025, 0, 1);
    const result = computePaybackProgress(investment, 4000, 0, now);

    expect(result.estimatedMonthsRemaining).toBeNull();
    expect(result.estimatedPaidOffDate).toBeNull();
  });
});

describe("netMonthlyCashFlow", () => {
  it("subtracts the mensualité from monthly savings", () => {
    expect(netMonthlyCashFlow(investment, 150)).toBe(70);
    expect(netMonthlyCashFlow(investment, 50)).toBe(-30);
  });
});
