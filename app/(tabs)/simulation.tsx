import React, { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { useSettingsStore } from "@/store/useSettingsStore";
import { computeSavings } from "@/lib/calculations/tariff";
import { computePaybackProgress } from "@/lib/calculations/payback";
import { simulateEvCharging } from "@/lib/calculations/evCharging";
import { generateMockDay, forecastSolarSurplusByHour } from "@/lib/enphase/mock";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { SliderField } from "@/components/ui/SliderField";
import { StatTile } from "@/components/charts/StatTile";

const KWH_PER_KM = 0.18;

function monthsToText(months: number | null): string {
  if (months === null) return "—";
  if (months <= 0) return "atteint";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} mois`;
  return `${years} an${years > 1 ? "s" : ""}${rest ? ` et ${rest} mois` : ""}`;
}

export default function SimulationScreen() {
  const { colors, space } = useTheme();
  const { tariff, investment, mockSite, evCharger } = useSettingsStore();

  const [simPanelKwp, setSimPanelKwp] = useState(mockSite.panelKwp);
  const [simDailyKm, setSimDailyKm] = useState(30);

  const simSite = { ...mockSite, panelKwp: simPanelKwp };

  const daySavings = useMemo(() => {
    const intervals = generateMockDay(new Date(2026, 5, 21), simSite);
    return computeSavings(intervals, tariff);
  }, [simPanelKwp, tariff]);

  const evDailyKwh = simDailyKm * KWH_PER_KM;

  const evPlan = useMemo(() => {
    const solarSurplusByHour = forecastSolarSurplusByHour(simSite);
    return simulateEvCharging({
      energyNeededKwh: evDailyKwh,
      chargerPowerKw: evCharger.chargerPowerKw,
      windowStartHour: evCharger.defaultWindowStartHour,
      windowEndHour: evCharger.defaultWindowEndHour,
      tariff,
      solarSurplusByHour,
    });
  }, [simPanelKwp, evDailyKwh, evCharger, tariff]);

  const monthlySolarSavingsEUR = daySavings.totalSavingsEUR * 30.4;
  const monthlyEvCostEUR = evPlan.totalCostEUR * 30.4;
  const netMonthlyEUR = monthlySolarSavingsEUR - monthlyEvCostEUR;

  const payback = useMemo(
    () => computePaybackProgress(investment, 0, monthlySolarSavingsEUR, new Date()),
    [investment, monthlySolarSavingsEUR]
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.page }}
      contentContainerStyle={{ padding: space.lg, paddingTop: space.xxl, gap: space.lg }}
    >
      <ScreenHeader title="Simulation" subtitle="Teste des scénarios avant de décider" />

      <Card style={{ gap: space.lg }}>
        <SliderField
          label="Puissance des panneaux"
          value={simPanelKwp}
          minimumValue={1}
          maximumValue={12}
          step={0.5}
          onValueChange={setSimPanelKwp}
          formatValue={(v) => `${v.toFixed(1)} kWc`}
        />
        <SliderField
          label="Trajet quotidien du véhicule"
          value={simDailyKm}
          minimumValue={0}
          maximumValue={150}
          step={5}
          onValueChange={setSimDailyKm}
          formatValue={(v) => `${v} km/j`}
        />
      </Card>

      <Card>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "600", letterSpacing: 0.4 }}>
          PROJECTION MENSUELLE
        </Text>
        <View style={{ flexDirection: "row", gap: space.lg, marginTop: space.md }}>
          <StatTile
            label="Économie solaire"
            value={monthlySolarSavingsEUR.toFixed(0)}
            unit="€"
            color={colors.status.good}
          />
          <StatTile
            label="Coût charge VE"
            value={monthlyEvCostEUR.toFixed(0)}
            unit="€"
            color={colors.energy.evCharging}
          />
        </View>
        <View style={{ marginTop: space.lg }}>
          <StatTile
            label="Solde net mensuel"
            value={netMonthlyEUR.toFixed(0)}
            unit="€"
            color={netMonthlyEUR >= 0 ? colors.status.good : colors.status.critical}
          />
        </View>
      </Card>

      <Card>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "600", letterSpacing: 0.4 }}>
          AMORTISSEMENT PROJETÉ
        </Text>
        <Text style={{ color: colors.textPrimary, marginTop: space.sm, fontSize: 16 }}>
          {investment.totalPriceEUR.toFixed(0)} € investis · remboursés en{" "}
          {monthsToText(payback.estimatedMonthsRemaining)} à ce rythme
        </Text>
      </Card>
    </ScrollView>
  );
}
