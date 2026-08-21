import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { useSettingsStore } from "@/store/useSettingsStore";
import { computeSavings } from "@/lib/calculations/tariff";
import { computePaybackProgress } from "@/lib/calculations/payback";
import { simulateEvCharging } from "@/lib/calculations/evCharging";
import { generateMockDay, forecastSolarSurplusByHour } from "@/lib/enphase/mock";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { SliderField } from "@/components/ui/SliderField";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { StatTile } from "@/components/charts/StatTile";
import { SplitBar } from "@/components/charts/SplitBar";

const KWH_PER_KM = 0.18;

function monthsToText(months: number | null): string {
  if (months === null) return "—";
  if (months <= 0) return "déjà amorti";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} mois`;
  return `${years} an${years > 1 ? "s" : ""}${rest ? ` et ${rest} mois` : ""}`;
}

export default function SimulationScreen() {
  const { colors, type, space } = useTheme();
  const { tariff, investment, mockSite, evCharger } = useSettingsStore();

  const [simPanelKwp, setSimPanelKwp] = useState(mockSite.panelKwp);
  const [simDailyKm, setSimDailyKm] = useState(30);

  const simSite = useMemo(() => ({ ...mockSite, panelKwp: simPanelKwp }), [mockSite, simPanelKwp]);

  // A fixed reference day keeps the comparison stable while sliders move.
  const daySavings = useMemo(() => {
    const intervals = generateMockDay(new Date(2026, 5, 21), simSite);
    return computeSavings(intervals, tariff);
  }, [simSite, tariff]);

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
  }, [simSite, evDailyKwh, evCharger, tariff]);

  const monthlySolarSavingsEUR = daySavings.totalSavingsEUR * 30.4;
  const monthlyEvCostEUR = evPlan.totalCostEUR * 30.4;
  const monthlyEvNaiveEUR = evPlan.naiveCostEUR * 30.4;
  const netMonthlyEUR = monthlySolarSavingsEUR - monthlyEvCostEUR;

  const payback = useMemo(
    () => computePaybackProgress(investment, 0, monthlySolarSavingsEUR, new Date()),
    [investment, monthlySolarSavingsEUR]
  );

  return (
    <Screen title="Simulation" subtitle="Teste un scénario avant de décider">
      <Card style={{ gap: space.lg }}>
        <SectionLabel>Hypothèses</SectionLabel>
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
          label="Trajet quotidien"
          value={simDailyKm}
          minimumValue={0}
          maximumValue={150}
          step={5}
          onValueChange={setSimDailyKm}
          formatValue={(v) => `${v} km/j`}
        />
        <Text style={[type.caption, { color: colors.textMuted }]}>
          Consommation estimée du véhicule : {KWH_PER_KM} kWh/km, soit {evDailyKwh.toFixed(1)} kWh par
          jour.
        </Text>
      </Card>

      <Card>
        <SectionLabel>Solde mensuel</SectionLabel>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.sm }}>
          <Text
            style={{
              color: netMonthlyEUR >= 0 ? colors.status.good : colors.status.critical,
              fontSize: 34,
              fontWeight: "700",
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {netMonthlyEUR >= 0 ? "+" : ""}
            {netMonthlyEUR.toFixed(0)} €
          </Text>
          <Text style={[type.body, { color: colors.textSecondary, flexShrink: 1 }]}>par mois</Text>
        </View>

        <View style={{ marginTop: space.lg }}>
          <SplitBar
            segments={[
              { label: "Économie solaire", value: monthlySolarSavingsEUR, color: colors.status.good },
              { label: "Coût charge véhicule", value: monthlyEvCostEUR, color: colors.energy.evCharging },
            ]}
            unit="€"
          />
        </View>
      </Card>

      <Card>
        <SectionLabel>Charge du véhicule</SectionLabel>
        <View style={{ flexDirection: "row", gap: space.lg }}>
          <StatTile
            label="Charge optimisée"
            value={monthlyEvCostEUR.toFixed(0)}
            unit="€"
            color={colors.status.good}
            caption="par mois"
          />
          <StatTile
            label="Sans optimisation"
            value={monthlyEvNaiveEUR.toFixed(0)}
            unit="€"
            color={colors.status.warning}
            caption={`soit ${(monthlyEvNaiveEUR - monthlyEvCostEUR).toFixed(0)} € de plus`}
          />
        </View>
      </Card>

      <Card>
        <SectionLabel>Amortissement dans ce scénario</SectionLabel>
        <Text style={[type.h2, { color: colors.textPrimary }]}>
          {monthsToText(payback.estimatedMonthsRemaining)}
        </Text>
        <Text style={[type.body, { color: colors.textSecondary, marginTop: space.xs }]}>
          Pour {investment.totalPriceEUR.toFixed(0)} € investis, à {monthlySolarSavingsEUR.toFixed(0)} €
          d'économie par mois.
        </Text>
        <Text style={[type.caption, { color: colors.textMuted, marginTop: space.sm }]}>
          Projection sur une journée type ensoleillée — la moyenne réelle sur l'année sera plus basse.
        </Text>
      </Card>
    </Screen>
  );
}
