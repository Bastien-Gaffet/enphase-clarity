import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { useEnergyStore } from "@/store/useEnergyStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useHistoryStore } from "@/store/useHistoryStore";
import { computeSavings } from "@/lib/calculations/tariff";
import { computeSavingsFromRollups } from "@/lib/enphase/history";
import { computePaybackProgress, netMonthlyCashFlow } from "@/lib/calculations/payback";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Pill } from "@/components/ui/Pill";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { StatTile } from "@/components/charts/StatTile";
import { SplitBar } from "@/components/charts/SplitBar";

function monthsToText(months: number | null): string {
  if (months === null) return "—";
  if (months <= 0) return "maintenant";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} mois`;
  return `${years} an${years > 1 ? "s" : ""}${rest ? ` et ${rest} mois` : ""}`;
}

export default function EconomiesScreen() {
  const { colors, type, space } = useTheme();
  const todayIntervals = useEnergyStore((s) => s.todayIntervals);
  const { tariff, investment, dataSource } = useSettingsStore();
  const { rollups, hasMore, loading: historyLoading } = useHistoryStore();

  const todaySavings = useMemo(() => computeSavings(todayIntervals, tariff), [todayIntervals, tariff]);

  const rollupList = useMemo(
    () => Object.values(rollups).sort((a, b) => a.date.localeCompare(b.date)),
    [rollups]
  );
  const hasRealHistory = dataSource === "live" && rollupList.length > 0;

  const now = new Date();
  const commissioned = new Date(investment.commissionedOn);
  const daysSinceCommissioning = Math.max(1, Math.round((now.getTime() - commissioned.getTime()) / 86400000));
  const daysThisMonth = now.getDate();
  const monthKey = now.toISOString().slice(0, 7);

  const cumulativeSavingsEUR = useMemo(() => {
    if (hasRealHistory) {
      return computeSavingsFromRollups(rollupList, tariff).totalSavingsEUR + todaySavings.totalSavingsEUR;
    }
    return todaySavings.totalSavingsEUR * daysSinceCommissioning;
  }, [hasRealHistory, rollupList, tariff, todaySavings, daysSinceCommissioning]);

  const monthToDateEUR = useMemo(() => {
    if (hasRealHistory) {
      const monthRollups = rollupList.filter((r) => r.date.startsWith(monthKey));
      return computeSavingsFromRollups(monthRollups, tariff).totalSavingsEUR + todaySavings.totalSavingsEUR;
    }
    return todaySavings.totalSavingsEUR * daysThisMonth;
  }, [hasRealHistory, rollupList, tariff, todaySavings, daysThisMonth, monthKey]);

  const avgMonthlySavingsEUR = useMemo(() => {
    if (hasRealHistory) {
      const recent = rollupList.slice(-30);
      const total = computeSavingsFromRollups(recent, tariff).totalSavingsEUR;
      return (total / recent.length) * 30.4;
    }
    return todaySavings.totalSavingsEUR * 30.4;
  }, [hasRealHistory, rollupList, tariff, todaySavings]);

  const payback = useMemo(
    () => computePaybackProgress(investment, cumulativeSavingsEUR, avgMonthlySavingsEUR, now),
    [investment, cumulativeSavingsEUR, avgMonthlySavingsEUR]
  );

  const cashFlow = netMonthlyCashFlow(investment, avgMonthlySavingsEUR);
  const isFinanced = investment.monthlyPaymentEUR > 0;

  const hpKwh = todaySavings.heuresPleinesKwh;
  const hcKwh = todaySavings.heuresCreusesKwh;

  return (
    <Screen title="Économies" subtitle="Ce que tes panneaux te rapportent">
      {dataSource === "live" ? (
        <Pill
          label={
            hasRealHistory
              ? `Historique réel · ${rollupList.length} j${hasMore || historyLoading ? " · sync…" : ""}`
              : historyLoading
              ? "Synchronisation…"
              : "En attente de données"
          }
          tone={hasRealHistory ? "good" : "neutral"}
        />
      ) : null}

      <Card>
        <SectionLabel>Amortissement</SectionLabel>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.sm }}>
          <Text
            style={{ color: colors.textPrimary, fontSize: 34, fontWeight: "700" }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {Math.round(payback.percentComplete * 100)}%
          </Text>
          <Text style={[type.body, { color: colors.textSecondary, flexShrink: 1 }]} numberOfLines={1}>
            {payback.cumulativeSavingsEUR.toFixed(0)} € sur {payback.totalInvestmentEUR.toFixed(0)} €
          </Text>
        </View>

        <View style={{ marginTop: space.md }}>
          <ProgressBar progress={payback.percentComplete} color={colors.status.good} />
        </View>

        <Text style={[type.body, { color: colors.textSecondary, marginTop: space.md }]}>
          {payback.percentComplete >= 1
            ? "Installation amortie — tout ce qui suit est du gain net."
            : `Reste ${payback.amountRemainingEUR.toFixed(0)} € · amorti dans ${monthsToText(
                payback.estimatedMonthsRemaining
              )}`}
        </Text>
        <Text style={[type.caption, { color: colors.textMuted, marginTop: space.xs }]}>
          {hasRealHistory
            ? "Calculé sur ton historique réel, au tarif actuel."
            : "Estimé depuis le rythme du jour — se précise avec l'historique réel."}
        </Text>
      </Card>

      <Card>
        <SectionLabel>Rythme</SectionLabel>
        <View style={{ flexDirection: "row", gap: space.lg }}>
          <StatTile
            label="Ce mois-ci"
            value={monthToDateEUR.toFixed(0)}
            unit="€"
            color={colors.status.good}
          />
          <StatTile
            label="Moyenne mensuelle"
            value={avgMonthlySavingsEUR.toFixed(0)}
            unit="€"
            caption="sur les 30 derniers jours"
          />
        </View>
      </Card>

      {isFinanced ? (
        <Card>
          <SectionLabel>Trésorerie mensuelle</SectionLabel>
          <View style={{ flexDirection: "row", gap: space.lg }}>
            <StatTile
              label="Mensualité"
              value={`-${investment.monthlyPaymentEUR.toFixed(0)}`}
              unit="€"
              color={colors.status.critical}
            />
            <StatTile
              label="Solde net"
              value={`${cashFlow >= 0 ? "+" : ""}${cashFlow.toFixed(0)}`}
              unit="€"
              color={cashFlow >= 0 ? colors.status.good : colors.status.warning}
              caption={cashFlow >= 0 ? "les panneaux paient leur crédit" : "reste à ta charge chaque mois"}
            />
          </View>
        </Card>
      ) : null}

      <Card>
        <SectionLabel>Réseau aujourd'hui</SectionLabel>
        <SplitBar
          segments={[
            { label: "Heures pleines", value: hpKwh, color: colors.energy.heuresPleines },
            { label: "Heures creuses", value: hcKwh, color: colors.energy.heuresCreuses },
          ]}
          unit="kWh"
        />
        <View style={{ flexDirection: "row", gap: space.lg, marginTop: space.lg }}>
          <StatTile
            label="Acheté au réseau"
            value={todaySavings.gridCostEUR.toFixed(2)}
            unit="€"
            color={colors.energy.grid}
          />
          <StatTile
            label="Surplus revendu"
            value={todaySavings.exportRevenueEUR.toFixed(2)}
            unit="€"
            color={colors.energy.surplus}
            caption={`${todaySavings.exportedKwh.toFixed(1)} kWh exportés`}
          />
        </View>
      </Card>
    </Screen>
  );
}
