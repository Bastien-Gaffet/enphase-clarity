import React, { useMemo } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { useEnergyStore } from "@/store/useEnergyStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { computeSavings } from "@/lib/calculations/tariff";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { RingGauge } from "@/components/charts/RingGauge";
import { StatTile } from "@/components/charts/StatTile";
import { Sparkline } from "@/components/charts/Sparkline";
import { Legend } from "@/components/charts/Legend";

function formatKw(kw: number): string {
  return kw.toFixed(kw < 10 ? 2 : 1);
}

export default function DashboardScreen() {
  const { colors, space } = useTheme();
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

  const gridKw = snapshot?.gridKw ?? 0;
  const isExporting = gridKw < -0.05;
  const isImporting = gridKw > 0.05;
  const statusLabel = isImporting
    ? `Import réseau · ${formatKw(gridKw)} kW`
    : isExporting
    ? `Export surplus · ${formatKw(-gridKw)} kW`
    : "Autonome";
  const statusTone = isImporting ? "warning" : "good";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.page }}
      contentContainerStyle={{ padding: space.lg, paddingTop: space.xxl, gap: space.lg }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.textMuted} />}
    >
      <ScreenHeader title="Tableau de bord" subtitle="Production et consommation en direct" />

      <Pill label={statusLabel} tone={statusTone as any} />

      {error ? (
        <Card>
          <Text style={{ color: colors.status.critical }}>{error}</Text>
        </Card>
      ) : null}

      <Card style={{ alignItems: "center" }}>
        <RingGauge
          progress={savings.autonomyRatio}
          color={colors.status.good}
          label="AUTONOMIE AUJOURD'HUI"
          value={`${Math.round(savings.autonomyRatio * 100)}%`}
        />
      </Card>

      <Card>
        <View style={{ flexDirection: "row", gap: space.lg }}>
          <StatTile
            label="Production"
            value={formatKw(snapshot?.productionKw ?? 0)}
            unit="kW"
            color={colors.energy.production}
          />
          <StatTile
            label="Consommation"
            value={formatKw(snapshot?.consumptionKw ?? 0)}
            unit="kW"
            color={colors.energy.consumption}
          />
        </View>
      </Card>

      <Card>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "600", letterSpacing: 0.4 }}>
          COURBE DU JOUR
        </Text>
        <View style={{ marginTop: space.md, alignItems: "center" }}>
          <Sparkline
            series={[
              { values: productionCurve, color: colors.energy.production, filled: true },
              { values: consumptionCurve, color: colors.energy.consumption },
            ]}
          />
        </View>
        <Legend
          items={[
            { label: "Production", color: colors.energy.production },
            { label: "Consommation", color: colors.energy.consumption },
          ]}
        />
      </Card>

      <Card>
        <View style={{ flexDirection: "row", gap: space.lg }}>
          <StatTile
            label="Économie aujourd'hui"
            value={savings.totalSavingsEUR.toFixed(2)}
            unit="€"
            color={colors.status.good}
          />
          <StatTile
            label="Autoconsommé"
            value={`${Math.round(savings.selfConsumptionRatio * 100)}`}
            unit="%"
            caption="de la production utilisée sur place"
          />
        </View>
      </Card>
    </ScrollView>
  );
}
