import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";
import { computeSavings } from "@/lib/calculations/tariff";
import { computePaybackProgress } from "@/lib/calculations/payback";
import { simulateEvCharging } from "@/lib/calculations/evCharging";
import { generateMockDay, forecastSolarSurplusByHour } from "@/lib/enphase/mock";
import { Screen } from "@/components/core/Screen";
import { Surface } from "@/components/core/Surface";
import { Txt } from "@/components/core/Txt";
import { Hero } from "@/components/core/Hero";
import { SectionHeader, StatBlock } from "@/components/core/Blocks";
import { SliderField } from "@/components/core/Controls";
import { SplitMeter } from "@/components/viz/Meters";
import { colors } from "@/theme/colors";
import { space } from "@/theme/spacing";

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
  const { tariff, investment, mockSite, evCharger } = useSettingsStore();

  const [simPanelKwp, setSimPanelKwp] = useState(mockSite.panelKwp);
  const [simDailyKm, setSimDailyKm] = useState(30);

  const simSite = useMemo(() => ({ ...mockSite, panelKwp: simPanelKwp }), [mockSite, simPanelKwp]);

  // A fixed reference day keeps the comparison stable while the sliders move.
  const daySavings = useMemo(
    () => computeSavings(generateMockDay(new Date(2026, 5, 21), simSite), tariff),
    [simSite, tariff]
  );

  const evDailyKwh = simDailyKm * KWH_PER_KM;

  const evPlan = useMemo(
    () =>
      simulateEvCharging({
        energyNeededKwh: evDailyKwh,
        chargerPowerKw: evCharger.chargerPowerKw,
        windowStartHour: evCharger.defaultWindowStartHour,
        windowEndHour: evCharger.defaultWindowEndHour,
        tariff,
        solarSurplusByHour: forecastSolarSurplusByHour(simSite),
      }),
    [simSite, evDailyKwh, evCharger, tariff]
  );

  const solarMonthly = daySavings.totalSavingsEUR * 30.4;
  const evMonthly = evPlan.totalCostEUR * 30.4;
  const evNaiveMonthly = evPlan.naiveCostEUR * 30.4;
  const net = solarMonthly - evMonthly;

  const payback = useMemo(
    () => computePaybackProgress(investment, 0, solarMonthly, new Date()),
    [investment, solarMonthly]
  );

  return (
    <Screen title="Simulation">
      <Hero
        label="Solde mensuel du scénario"
        value={`${net >= 0 ? "+" : ""}${net.toFixed(0)}`}
        unit="€"
        valueColor={net >= 0 ? colors.status.good : colors.status.critical}
        caption={`${simPanelKwp.toFixed(1)} kWc de panneaux et ${simDailyKm} km par jour en électrique.`}
      >
        <View style={{ marginTop: space.md }}>
          <SplitMeter
            segments={[
              { label: "Économie solaire", value: solarMonthly, color: colors.status.good },
              { label: "Coût de la charge", value: evMonthly, color: colors.energy.evCharging },
            ]}
            unit="€"
          />
        </View>
      </Hero>

      <Surface gap={space.lg}>
        <SectionHeader>Hypothèses</SectionHeader>
        <SliderField
          label="Puissance des panneaux"
          value={simPanelKwp}
          minimumValue={1}
          maximumValue={12}
          step={0.5}
          onValueChange={setSimPanelKwp}
          format={(v) => `${v.toFixed(1)} kWc`}
        />
        <SliderField
          label="Trajet quotidien"
          value={simDailyKm}
          minimumValue={0}
          maximumValue={150}
          step={5}
          onValueChange={setSimDailyKm}
          format={(v) => `${v} km/j`}
        />
        <Txt variant="caption" tone="faint">
          Véhicule estimé à {KWH_PER_KM} kWh/km, soit {evDailyKwh.toFixed(1)} kWh par jour.
        </Txt>
      </Surface>

      <Surface gap={space.md}>
        <SectionHeader>Charge du véhicule</SectionHeader>
        <View style={{ flexDirection: "row", gap: space.lg }}>
          <StatBlock
            label="Optimisée"
            value={evMonthly.toFixed(0)}
            unit="€"
            color={colors.status.good}
            caption="par mois"
          />
          <StatBlock
            label="Sans rien faire"
            value={evNaiveMonthly.toFixed(0)}
            unit="€"
            color={colors.status.warning}
            caption={`${(evNaiveMonthly - evMonthly).toFixed(0)} € de plus`}
          />
        </View>
      </Surface>

      <Surface gap={space.sm}>
        <SectionHeader>Amortissement dans ce scénario</SectionHeader>
        <Txt variant="title">{monthsToText(payback.estimatedMonthsRemaining)}</Txt>
        <Txt variant="body" tone="secondary">
          Pour {investment.totalPriceEUR.toFixed(0)} € investis, à {solarMonthly.toFixed(0)} € d'économie
          par mois.
        </Txt>
        <Txt variant="caption" tone="faint">
          Projection sur une journée type ensoleillée — la moyenne réelle sur l'année sera plus basse.
        </Txt>
      </Surface>
    </Screen>
  );
}
