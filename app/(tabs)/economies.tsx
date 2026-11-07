import React, { useMemo } from "react";
import { View } from "react-native";
import { useEnergyStore } from "@/store/useEnergyStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useHistoryStore } from "@/store/useHistoryStore";
import { computeSavings } from "@/lib/calculations/tariff";
import { computeSavingsFromRollups } from "@/lib/enphase/history";
import { computePaybackProgress, netMonthlyCashFlow } from "@/lib/calculations/payback";
import { Screen } from "@/components/core/Screen";
import { Surface } from "@/components/core/Surface";
import { Txt } from "@/components/core/Txt";
import { Hero } from "@/components/core/Hero";
import { Chip, SectionHeader, StatBlock } from "@/components/core/Blocks";
import { Meter, SplitMeter } from "@/components/viz/Meters";
import { colors } from "@/theme/colors";
import { space } from "@/theme/spacing";

function monthsToText(months: number | null): string {
  if (months === null) return "—";
  if (months <= 0) return "maintenant";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} mois`;
  return `${years} an${years > 1 ? "s" : ""}${rest ? ` et ${rest} mois` : ""}`;
}

export default function EconomiesScreen() {
  const todayIntervals = useEnergyStore((s) => s.todayIntervals);
  const { tariff, investment, dataSource } = useSettingsStore();
  const { rollups, hasMore, loading: historyLoading } = useHistoryStore();

  const today = useMemo(() => computeSavings(todayIntervals, tariff), [todayIntervals, tariff]);

  const rollupList = useMemo(
    () => Object.values(rollups).sort((a, b) => a.date.localeCompare(b.date)),
    [rollups]
  );
  const hasRealHistory = dataSource === "live" && rollupList.length > 0;

  const now = new Date();
  const commissioned = new Date(investment.commissionedOn);
  const daysSince = Math.max(1, Math.round((now.getTime() - commissioned.getTime()) / 86400000));
  const monthKey = now.toISOString().slice(0, 7);

  const cumulativeEUR = useMemo(() => {
    if (hasRealHistory) {
      return computeSavingsFromRollups(rollupList, tariff).totalSavingsEUR + today.totalSavingsEUR;
    }
    return today.totalSavingsEUR * daysSince;
  }, [hasRealHistory, rollupList, tariff, today, daysSince]);

  const monthToDateEUR = useMemo(() => {
    if (hasRealHistory) {
      const inMonth = rollupList.filter((r) => r.date.startsWith(monthKey));
      return computeSavingsFromRollups(inMonth, tariff).totalSavingsEUR + today.totalSavingsEUR;
    }
    return today.totalSavingsEUR * now.getDate();
  }, [hasRealHistory, rollupList, tariff, today, monthKey]);

  const avgMonthlyEUR = useMemo(() => {
    if (hasRealHistory) {
      const recent = rollupList.slice(-30);
      return (computeSavingsFromRollups(recent, tariff).totalSavingsEUR / recent.length) * 30.4;
    }
    return today.totalSavingsEUR * 30.4;
  }, [hasRealHistory, rollupList, tariff, today]);

  const payback = useMemo(
    () => computePaybackProgress(investment, cumulativeEUR, avgMonthlyEUR, now),
    [investment, cumulativeEUR, avgMonthlyEUR]
  );

  const cashFlow = netMonthlyCashFlow(investment, avgMonthlyEUR);
  const isFinanced = investment.monthlyPaymentEUR > 0;
  const done = payback.percentComplete >= 1;

  return (
    <Screen title="Économies">
      <Hero
        label="Amortissement"
        value={`${Math.round(payback.percentComplete * 100)}`}
        unit="%"
        valueColor={done ? colors.status.good : colors.ink.primary}
        caption={
          done
            ? "Installation amortie — tout ce qui suit est du gain net."
            : `${payback.cumulativeSavingsEUR.toFixed(0)} € remboursés sur ${payback.totalInvestmentEUR.toFixed(0)} €, amorti dans ${monthsToText(payback.estimatedMonthsRemaining)}.`
        }
      >
        <View style={{ marginTop: space.md, gap: space.sm }}>
          <Meter progress={payback.percentComplete} color={colors.status.good} />
          {dataSource === "live" ? (
            <Chip
              label={
                hasRealHistory
                  ? `Historique réel · ${rollupList.length} j${hasMore || historyLoading ? " · sync" : ""}`
                  : historyLoading
                  ? "Synchronisation"
                  : "En attente de données"
              }
              color={hasRealHistory ? colors.status.good : colors.ink.muted}
              icon={hasRealHistory ? "checkmark-circle" : "cloud-download"}
            />
          ) : (
            <Txt variant="caption" tone="faint">
              Estimé depuis le rythme du jour — se précise avec l'historique réel.
            </Txt>
          )}
        </View>
      </Hero>

      <Surface gap={space.md}>
        <SectionHeader>Rythme</SectionHeader>
        <View style={{ flexDirection: "row", gap: space.lg }}>
          <StatBlock
            label="Ce mois-ci"
            value={monthToDateEUR.toFixed(0)}
            unit="€"
            color={colors.status.good}
          />
          <StatBlock
            label="Moyenne"
            value={avgMonthlyEUR.toFixed(0)}
            unit="€"
            caption="par mois, 30 derniers jours"
          />
        </View>
      </Surface>

      {isFinanced ? (
        <Surface gap={space.md}>
          <SectionHeader>Trésorerie mensuelle</SectionHeader>
          <View style={{ flexDirection: "row", gap: space.lg }}>
            <StatBlock
              label="Mensualité"
              value={`-${investment.monthlyPaymentEUR.toFixed(0)}`}
              unit="€"
              color={colors.status.critical}
            />
            <StatBlock
              label="Solde net"
              value={`${cashFlow >= 0 ? "+" : ""}${cashFlow.toFixed(0)}`}
              unit="€"
              color={cashFlow >= 0 ? colors.status.good : colors.status.warning}
              caption={cashFlow >= 0 ? "le solaire paie son crédit" : "reste à ta charge"}
            />
          </View>
        </Surface>
      ) : null}

      <Surface gap={space.md}>
        <SectionHeader>Réseau aujourd'hui</SectionHeader>
        <SplitMeter
          segments={[
            { label: "Heures pleines", value: today.heuresPleinesKwh, color: colors.energy.heuresPleines },
            { label: "Heures creuses", value: today.heuresCreusesKwh, color: colors.energy.heuresCreuses },
          ]}
          unit="kWh"
        />
        <View style={{ flexDirection: "row", gap: space.lg, marginTop: space.xs }}>
          <StatBlock
            label="Acheté"
            value={today.gridCostEUR.toFixed(2)}
            unit="€"
            color={colors.energy.grid}
          />
          <StatBlock
            label="Revendu"
            value={today.exportRevenueEUR.toFixed(2)}
            unit="€"
            color={colors.energy.surplus}
            caption={`${today.exportedKwh.toFixed(1)} kWh exportés`}
          />
        </View>
      </Surface>
    </Screen>
  );
}
