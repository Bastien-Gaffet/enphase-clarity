import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { useEnergyStore } from "@/store/useEnergyStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { computeSavings, isHeureCreuse } from "@/lib/calculations/tariff";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { RingGauge } from "@/components/charts/RingGauge";
import { StatTile } from "@/components/charts/StatTile";
import { Sparkline } from "@/components/charts/Sparkline";
import { Legend } from "@/components/charts/Legend";
import { ChartFrame } from "@/components/charts/ChartFrame";

function formatKw(kw: number): string {
  if (!Number.isFinite(kw)) return "0.00";
  return kw.toFixed(kw < 10 ? 2 : 1);
}

/** Left-to-right flow strip: solar → home, with the grid on whichever side is active. */
function FlowRow({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  const { colors, type, space } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: colors.surfaceRaised,
          borderWidth: 1,
          borderColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 15 }}>{icon}</Text>
      </View>
      <Text style={[type.body, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={[type.bodyStrong, { color: colors.textPrimary, fontVariant: ["tabular-nums"] }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { colors, type, space } = useTheme();
  const { snapshot, todayIntervals, loading, refresh, error } = useEnergyStore();
  const tariff = useSettingsStore((s) => s.tariff);

  const savings = useMemo(() => computeSavings(todayIntervals, tariff), [todayIntervals, tariff]);

  const productionCurve = useMemo(
    () => todayIntervals.map((i) => i.productionKwh / (i.durationHours || 0.25)),
    [todayIntervals]
  );
  const consumptionCurve = useMemo(
    () => todayIntervals.map((i) => i.consumptionKwh / (i.durationHours || 0.25)),
    [todayIntervals]
  );

  const producedTodayKwh = useMemo(
    () => todayIntervals.reduce((sum, i) => sum + i.productionKwh, 0),
    [todayIntervals]
  );
  const consumedTodayKwh = useMemo(
    () => todayIntervals.reduce((sum, i) => sum + i.consumptionKwh, 0),
    [todayIntervals]
  );

  const gridKw = snapshot?.gridKw ?? 0;
  const productionKw = snapshot?.productionKw ?? 0;
  const consumptionKw = snapshot?.consumptionKw ?? 0;
  const isExporting = gridKw < -0.05;
  const isImporting = gridKw > 0.05;

  const now = new Date();
  const inHeuresCreuses = isHeureCreuse(now, tariff);

  const statusLabel = isImporting ? "Import réseau" : isExporting ? "Surplus revendu" : "Autonome";
  const statusTone = isImporting ? "warning" : "good";

  return (
    <Screen
      title="Tableau de bord"
      subtitle="Production et consommation en direct"
      onRefresh={refresh}
      refreshing={loading}
    >
      <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
        <Pill label={statusLabel} tone={statusTone as any} />
        <Pill
          label={inHeuresCreuses ? "Heures creuses" : "Heures pleines"}
          tone="neutral"
        />
      </View>

      {error ? (
        <Card>
          <Text style={[type.body, { color: colors.status.critical }]}>{error}</Text>
        </Card>
      ) : null}

      <Card style={{ alignItems: "center", gap: space.md }}>
        <RingGauge
          progress={savings.autonomyRatio}
          color={colors.status.good}
          label="AUTONOMIE DU JOUR"
          value={`${Math.round(savings.autonomyRatio * 100)}%`}
        />
        <Text style={[type.caption, { color: colors.textMuted, textAlign: "center" }]}>
          Part de ta consommation couverte par tes panneaux depuis minuit
        </Text>
      </Card>

      <Card style={{ gap: space.md }}>
        <SectionLabel>Flux en direct</SectionLabel>
        <FlowRow
          icon="☀️"
          label="Production solaire"
          value={`${formatKw(productionKw)} kW`}
          color={colors.energy.production}
        />
        <FlowRow
          icon="🏠"
          label="Consommation maison"
          value={`${formatKw(consumptionKw)} kW`}
          color={colors.textSecondary}
        />
        <FlowRow
          icon={isExporting ? "↗️" : "⚡"}
          label={isExporting ? "Envoyé au réseau" : "Tiré du réseau"}
          value={`${formatKw(Math.abs(gridKw))} kW`}
          color={isExporting ? colors.energy.surplus : colors.energy.grid}
        />
      </Card>

      <Card>
        <SectionLabel>Courbe du jour</SectionLabel>
        <ChartFrame height={110}>
          {(width) => (
            <Sparkline
              width={width}
              height={110}
              series={[
                { values: productionCurve, color: colors.energy.production, filled: true },
                { values: consumptionCurve, color: colors.energy.consumption },
              ]}
            />
          )}
        </ChartFrame>
        <Legend
          items={[
            { label: "Production", color: colors.energy.production },
            { label: "Consommation", color: colors.energy.consumption },
          ]}
        />
        <View style={{ flexDirection: "row", gap: space.lg, marginTop: space.lg }}>
          <StatTile label="Produit aujourd'hui" value={producedTodayKwh.toFixed(1)} unit="kWh" />
          <StatTile label="Consommé aujourd'hui" value={consumedTodayKwh.toFixed(1)} unit="kWh" />
        </View>
      </Card>

      <Card>
        <SectionLabel>Aujourd'hui en euros</SectionLabel>
        <View style={{ flexDirection: "row", gap: space.lg }}>
          <StatTile
            label="Économisé"
            value={savings.totalSavingsEUR.toFixed(2)}
            unit="€"
            color={colors.status.good}
          />
          <StatTile
            label="Autoconsommé"
            value={`${Math.round(savings.selfConsumptionRatio * 100)}`}
            unit="%"
            caption="de ta production utilisée sur place"
          />
        </View>
      </Card>
    </Screen>
  );
}
