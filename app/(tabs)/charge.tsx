import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";
import { simulateEvCharging } from "@/lib/calculations/evCharging";
import { forecastSolarSurplusByHour } from "@/lib/enphase/mock";
import { isHeureCreuse } from "@/lib/calculations/tariff";
import { Screen } from "@/components/core/Screen";
import { Surface } from "@/components/core/Surface";
import { Txt } from "@/components/core/Txt";
import { Hero } from "@/components/core/Hero";
import { SectionHeader, StatBlock } from "@/components/core/Blocks";
import { SliderField } from "@/components/core/Controls";
import { Frame } from "@/components/viz/Frame";
import { HourStrip } from "@/components/viz/HourStrip";
import { Legend } from "@/components/viz/Meters";
import { useTheme } from "@/theme/useTheme";

const hourLabel = (h: number) => `${String(Math.round(h)).padStart(2, "0")}h`;

/** Collapses the scheduled hours into readable ranges: "22h → 02h · 05h → 06h". */
function describeWindows(hours: number[]): string {
  if (hours.length === 0) return "—";
  const sorted = [...hours].sort((a, b) => a - b);
  const runs: number[][] = [];
  let run = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) run.push(sorted[i]);
    else {
      runs.push(run);
      run = [sorted[i]];
    }
  }
  runs.push(run);
  return runs.map((r) => `${hourLabel(r[0])} → ${hourLabel((r[r.length - 1] + 1) % 24)}`).join(" · ");
}

export default function ChargeScreen() {
  const { colors, space } = useTheme();
  const { tariff, mockSite, evCharger } = useSettingsStore();

  const [energyNeededKwh, setEnergyNeededKwh] = useState(
    Math.round(evCharger.batteryCapacityKwh * 0.5)
  );
  const [chargerPowerKw, setChargerPowerKw] = useState(evCharger.chargerPowerKw);
  const [windowStartHour, setWindowStartHour] = useState(evCharger.defaultWindowStartHour);
  const [windowEndHour, setWindowEndHour] = useState(evCharger.defaultWindowEndHour);

  const solarSurplusByHour = useMemo(() => forecastSolarSurplusByHour(mockSite), [mockSite]);

  const plan = useMemo(
    () =>
      simulateEvCharging({
        energyNeededKwh,
        chargerPowerKw,
        windowStartHour,
        windowEndHour,
        tariff,
        solarSurplusByHour,
      }),
    [energyNeededKwh, chargerPowerKw, windowStartHour, windowEndHour, tariff, solarSurplusByHour]
  );

  const scheduled = useMemo(() => new Set(plan.schedule.map((s) => s.hour)), [plan]);

  const cells = useMemo(
    () =>
      Array.from({ length: 24 }, (_, hour) => {
        const at = new Date();
        at.setHours(hour, 0, 0, 0);
        const hc = isHeureCreuse(at, tariff);
        const solar = solarSurplusByHour[hour] > 0.05;
        return {
          hour,
          value: hc ? tariff.hcPricePerKwh : tariff.hpPricePerKwh,
          color: solar
            ? colors.energy.production
            : hc
            ? colors.energy.heuresCreuses
            : colors.energy.heuresPleines,
          selected: scheduled.has(hour),
        };
      }),
    [tariff, solarSurplusByHour, scheduled]
  );

  const fromSolarKwh = plan.schedule.reduce((sum, s) => sum + s.fromSolarKwh, 0);
  const savingsPct = plan.naiveCostEUR > 0 ? Math.round((plan.savingsEUR / plan.naiveCostEUR) * 100) : 0;
  const notEnoughTime = plan.totalEnergyKwh + 1e-6 < energyNeededKwh;

  return (
    <Screen title="Charge">
      <Hero
        label="Économie sur cette charge"
        value={plan.savingsEUR.toFixed(2)}
        unit="€"
        valueColor={plan.savingsEUR > 0.005 ? colors.status.good : colors.ink.faint}
        caption={
          plan.savingsEUR > 0.005
            ? `Soit ${savingsPct} % de moins qu'une charge lancée dès le branchement.`
            : "Le tarif est constant sur cette plage : rien à gagner à décaler."
        }
      >
        <Surface level="raised" style={{ marginTop: space.md }} gap={4}>
          <Txt variant="overline" tone="muted">
            BRANCHER ET LAISSER CHARGER
          </Txt>
          <Txt variant="title" color={colors.brand.highlight}>
            {describeWindows(plan.recommendedStartHours)}
          </Txt>
          {notEnoughTime ? (
            <Txt variant="caption" tone="warning">
              Plage trop courte pour {energyNeededKwh.toFixed(1)} kWh à {chargerPowerKw.toFixed(1)} kW —
              seuls {plan.totalEnergyKwh.toFixed(1)} kWh entreront.
            </Txt>
          ) : null}
        </Surface>
      </Hero>

      <Surface gap={space.md}>
        <SectionHeader icon="pricetag">Coût du kWh, heure par heure</SectionHeader>
        <Frame height={92}>{(width) => <HourStrip data={cells} width={width} />}</Frame>
        <Legend
          items={[
            { label: "Surplus solaire", color: colors.energy.production },
            { label: "Heures creuses", color: colors.energy.heuresCreuses },
            { label: "Heures pleines", color: colors.energy.heuresPleines },
          ]}
        />
        <Txt variant="caption" tone="faint">
          Les barres pleines et soulignées sont les heures retenues par le plan.
        </Txt>
      </Surface>

      <Surface gap={space.md}>
        <SectionHeader icon="list">Détail</SectionHeader>
        <View style={{ flexDirection: "row", gap: space.lg }}>
          <StatBlock
            label="Coût optimisé"
            value={plan.totalCostEUR.toFixed(2)}
            unit="€"
            color={colors.status.good}
          />
          <StatBlock
            label="Sans rien faire"
            value={plan.naiveCostEUR.toFixed(2)}
            unit="€"
            color={colors.status.warning}
          />
        </View>
        <View style={{ flexDirection: "row", gap: space.lg }}>
          <StatBlock
            label="Depuis le solaire"
            value={fromSolarKwh.toFixed(1)}
            unit="kWh"
            color={colors.energy.production}
            caption="gratuit, non revendu"
          />
          <StatBlock label="Énergie chargée" value={plan.totalEnergyKwh.toFixed(1)} unit="kWh" />
        </View>
      </Surface>

      <Surface gap={space.lg}>
        <SectionHeader icon="options">Paramètres</SectionHeader>
        <SliderField
          label="Énergie à charger"
          value={energyNeededKwh}
          minimumValue={1}
          maximumValue={Math.max(1, evCharger.batteryCapacityKwh)}
          step={0.5}
          onValueChange={setEnergyNeededKwh}
          format={(v) => `${v.toFixed(1)} kWh`}
        />
        <SliderField
          label="Puissance de charge"
          value={chargerPowerKw}
          minimumValue={1.4}
          maximumValue={22}
          step={0.1}
          onValueChange={setChargerPowerKw}
          format={(v) => `${v.toFixed(1)} kW`}
        />
        <SliderField
          label="Branché à partir de"
          value={windowStartHour}
          minimumValue={0}
          maximumValue={23}
          step={1}
          onValueChange={setWindowStartHour}
          format={hourLabel}
        />
        <SliderField
          label="Doit être prêt à"
          value={windowEndHour}
          minimumValue={0}
          maximumValue={23}
          step={1}
          onValueChange={setWindowEndHour}
          format={hourLabel}
        />
      </Surface>
    </Screen>
  );
}
