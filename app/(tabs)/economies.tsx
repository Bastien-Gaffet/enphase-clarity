import React, { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { useEnergyStore } from "@/store/useEnergyStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useHistoryStore } from "@/store/useHistoryStore";
import { computeSavings } from "@/lib/calculations/tariff";
import { computeSavingsFromRollups } from "@/lib/enphase/history";
import { computePaybackProgress } from "@/lib/calculations/payback";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Pill } from "@/components/ui/Pill";
import { StatTile } from "@/components/charts/StatTile";
import { HourlyBarChart } from "@/components/charts/HourlyBarChart";
import { Legend } from "@/components/charts/Legend";

function monthsToText(months: number | null): string {
  if (months === null) return "—";
  if (months <= 0) return "atteint";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} mois`;
  return `${years} an${years > 1 ? "s" : ""}${rest ? ` et ${rest} mois` : ""}`;
}

export default function EconomiesScreen() {
  const { colors, space } = useTheme();
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

  const hpHcBars = [
    { hour: 0, value: todaySavings.heuresPleinesKwh, color: colors.energy.heuresPleines, highlighted: true },
    { hour: 1, value: todaySavings.heuresCreusesKwh, color: colors.energy.heuresCreuses, highlighted: true },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.page }}
      contentContainerStyle={{ padding: space.lg, paddingTop: space.xxl, gap: space.lg }}
    >
      <ScreenHeader title="Économies" subtitle="Amortissement de l'installation solaire" />

      {dataSource === "live" ? (
        <Pill
          label={
            hasRealHistory
              ? `Historique réel · ${rollupList.length} j${hasMore || historyLoading ? " · sync…" : ""}`
              : historyLoading
              ? "Synchronisation de l'historique…"
              : "En attente de données"
          }
          tone={hasRealHistory ? "good" : "neutral"}
        />
      ) : null}

      <Card>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "600", letterSpacing: 0.4 }}>
          AMORTISSEMENT
        </Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: space.sm }}>
          <Text style={[{ color: colors.textPrimary, fontSize: 32, fontWeight: "700" }]}>
            {Math.round(payback.percentComplete * 100)}%
          </Text>
          <Text style={{ color: colors.textSecondary, marginLeft: space.sm }}>
            {payback.cumulativeSavingsEUR.toFixed(0)} € / {payback.totalInvestmentEUR.toFixed(0)} €
          </Text>
        </View>
        <View style={{ marginTop: space.md }}>
          <ProgressBar progress={payback.percentComplete} color={colors.status.good} />
        </View>
        <Text style={{ color: colors.textSecondary, marginTop: space.md }}>
          {payback.percentComplete >= 1
            ? "Panneaux amortis 🎉"
            : `Reste ${payback.amountRemainingEUR.toFixed(0)} € — estimé dans ${monthsToText(
                payback.estimatedMonthsRemaining
              )}`}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: space.xs }}>
          {hasRealHistory
            ? "Calculé sur l'historique réel de production/consommation, au tarif actuel."
            : "Estimation à partir du rythme d'économie du jour — se précise avec l'historique réel."}
        </Text>
      </Card>

      <Card>
        <View style={{ flexDirection: "row", gap: space.lg }}>
          <StatTile label="Ce mois-ci" value={monthToDateEUR.toFixed(0)} unit="€" color={colors.status.good} />
          <StatTile
            label="Revente surplus"
            value={todaySavings.exportRevenueEUR.toFixed(2)}
            unit="€"
            color={colors.energy.surplus}
            caption="aujourd'hui"
          />
        </View>
      </Card>

      <Card>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "600", letterSpacing: 0.4 }}>
          HEURES CREUSES / PLEINES — AUJOURD'HUI
        </Text>
        <View style={{ marginTop: space.md, alignItems: "center" }}>
          <HourlyBarChart data={hpHcBars} width={160} height={100} barGap={24} />
        </View>
        <Legend
          items={[
            { label: `Heures pleines · ${todaySavings.heuresPleinesKwh.toFixed(1)} kWh`, color: colors.energy.heuresPleines },
            { label: `Heures creuses · ${todaySavings.heuresCreusesKwh.toFixed(1)} kWh`, color: colors.energy.heuresCreuses },
          ]}
        />
      </Card>
    </ScrollView>
  );
}
