import React, { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { useEnergyStore } from "@/store/useEnergyStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { computeSavings } from "@/lib/calculations/tariff";
import { computePaybackProgress } from "@/lib/calculations/payback";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
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
  const { tariff, investment } = useSettingsStore();

  const savings = useMemo(() => computeSavings(todayIntervals, tariff), [todayIntervals, tariff]);

  const now = new Date();
  const commissioned = new Date(investment.commissionedOn);
  const daysSinceCommissioning = Math.max(
    1,
    Math.round((now.getTime() - commissioned.getTime()) / 86400000)
  );
  const daysThisMonth = now.getDate();

  // Demo-mode estimate: extrapolate from today's savings rate until real
  // historical telemetry is wired in for the "live" data source.
  const cumulativeSavingsEUR = savings.totalSavingsEUR * daysSinceCommissioning;
  const monthToDateEUR = savings.totalSavingsEUR * daysThisMonth;
  const avgMonthlySavingsEUR = savings.totalSavingsEUR * 30.4;

  const payback = useMemo(
    () => computePaybackProgress(investment, cumulativeSavingsEUR, avgMonthlySavingsEUR, now),
    [investment, cumulativeSavingsEUR, avgMonthlySavingsEUR]
  );

  const hpHcBars = [
    { hour: 0, value: savings.heuresPleinesKwh, color: colors.energy.heuresPleines, highlighted: true },
    { hour: 1, value: savings.heuresCreusesKwh, color: colors.energy.heuresCreuses, highlighted: true },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.page }}
      contentContainerStyle={{ padding: space.lg, paddingTop: space.xxl, gap: space.lg }}
    >
      <ScreenHeader title="Économies" subtitle="Amortissement de l'installation solaire" />

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
          Estimation à partir du rythme d'économie actuel — se précise avec l'historique réel.
        </Text>
      </Card>

      <Card>
        <View style={{ flexDirection: "row", gap: space.lg }}>
          <StatTile label="Ce mois-ci" value={monthToDateEUR.toFixed(0)} unit="€" color={colors.status.good} />
          <StatTile
            label="Revente surplus"
            value={savings.exportRevenueEUR.toFixed(2)}
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
            { label: `Heures pleines · ${savings.heuresPleinesKwh.toFixed(1)} kWh`, color: colors.energy.heuresPleines },
            { label: `Heures creuses · ${savings.heuresCreusesKwh.toFixed(1)} kWh`, color: colors.energy.heuresCreuses },
          ]}
        />
      </Card>
    </ScrollView>
  );
}
