import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { useSettingsStore } from "@/store/useSettingsStore";
import { simulateEvCharging } from "@/lib/calculations/evCharging";
import { forecastSolarSurplusByHour } from "@/lib/enphase/mock";
import { isHeureCreuse } from "@/lib/calculations/tariff";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { SliderField } from "@/components/ui/SliderField";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { StatTile } from "@/components/charts/StatTile";
import { HourlyBarChart } from "@/components/charts/HourlyBarChart";
import { Legend } from "@/components/charts/Legend";
import { ChartFrame } from "@/components/charts/ChartFrame";

function formatHour(h: number): string {
  return `${String(Math.round(h)).padStart(2, "0")}h`;
}

/** "22h → 02h" for a contiguous run of scheduled hours. */
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
  return runs
    .map((r) => `${formatHour(r[0])} → ${formatHour((r[r.length - 1] + 1) % 24)}`)
    .join(" · ");
}

export default function ChargeScreen() {
  const { colors, type, space } = useTheme();
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

  const scheduledHours = useMemo(
    () => new Set(plan.schedule.map((s) => s.hour)),
    [plan]
  );

  const bars = useMemo(
    () =>
      Array.from({ length: 24 }, (_, hour) => {
        const at = new Date();
        at.setHours(hour, 0, 0, 0);
        const hc = isHeureCreuse(at, tariff);
        const solar = solarSurplusByHour[hour] > 0.05;
        const color = solar
          ? colors.energy.production
          : hc
          ? colors.energy.heuresCreuses
          : colors.energy.heuresPleines;
        return {
          hour,
          value: hc ? tariff.hcPricePerKwh : tariff.hpPricePerKwh,
          color,
          highlighted: scheduledHours.has(hour),
        };
      }),
    [tariff, solarSurplusByHour, scheduledHours, colors]
  );

  const totalFromSolarKwh = plan.schedule.reduce((sum, s) => sum + s.fromSolarKwh, 0);
  const savingsPercent =
    plan.naiveCostEUR > 0 ? Math.round((plan.savingsEUR / plan.naiveCostEUR) * 100) : 0;

  const notEnoughTime = plan.totalEnergyKwh + 1e-6 < energyNeededKwh;

  return (
    <Screen title="Charge du véhicule" subtitle="Quand charger pour payer le moins cher">
      <Card style={{ gap: space.md }}>
        <SectionLabel>Plan recommandé</SectionLabel>
        <Text style={{ color: colors.brand.highlight, fontSize: 22, fontWeight: "700" }}>
          {describeWindows(plan.recommendedStartHours)}
        </Text>
        <Text style={[type.body, { color: colors.textSecondary }]}>
          {plan.savingsEUR > 0.005
            ? `Économise ${plan.savingsEUR.toFixed(2)} € (${savingsPercent} %) par rapport à une charge lancée dès le branchement.`
            : "Aucune économie possible sur cette plage — le tarif y est constant."}
        </Text>
        {notEnoughTime ? (
          <Text style={[type.caption, { color: colors.status.warning }]}>
            La plage est trop courte pour charger {energyNeededKwh.toFixed(1)} kWh à{" "}
            {chargerPowerKw.toFixed(1)} kW — seuls {plan.totalEnergyKwh.toFixed(1)} kWh entreront.
          </Text>
        ) : null}
      </Card>

      <Card>
        <SectionLabel>Résultat</SectionLabel>
        <View style={{ flexDirection: "row", gap: space.lg }}>
          <StatTile
            label="Coût optimisé"
            value={plan.totalCostEUR.toFixed(2)}
            unit="€"
            color={colors.status.good}
          />
          <StatTile
            label="Sans optimisation"
            value={plan.naiveCostEUR.toFixed(2)}
            unit="€"
            color={colors.status.warning}
          />
        </View>
        <View style={{ flexDirection: "row", gap: space.lg, marginTop: space.lg }}>
          <StatTile
            label="Depuis le solaire"
            value={totalFromSolarKwh.toFixed(1)}
            unit="kWh"
            color={colors.energy.production}
            caption="gratuit, non revendu"
          />
          <StatTile
            label="Énergie chargée"
            value={plan.totalEnergyKwh.toFixed(1)}
            unit="kWh"
          />
        </View>
      </Card>

      <Card>
        <SectionLabel>Coût du kWh heure par heure</SectionLabel>
        <ChartFrame height={110}>
          {(width) => <HourlyBarChart data={bars} width={width} height={100} />}
        </ChartFrame>
        <Legend
          items={[
            { label: "Surplus solaire", color: colors.energy.production },
            { label: "Heures creuses", color: colors.energy.heuresCreuses },
            { label: "Heures pleines", color: colors.energy.heuresPleines },
          ]}
        />
        <Text style={[type.caption, { color: colors.textMuted, marginTop: space.sm }]}>
          Les barres pleines sont les heures retenues par le plan ; 0h à gauche, 23h à droite.
        </Text>
      </Card>

      <Card style={{ gap: space.lg }}>
        <SectionLabel>Paramètres de la charge</SectionLabel>
        <SliderField
          label="Énergie à charger"
          value={energyNeededKwh}
          minimumValue={1}
          maximumValue={Math.max(1, evCharger.batteryCapacityKwh)}
          step={0.5}
          onValueChange={setEnergyNeededKwh}
          formatValue={(v) => `${v.toFixed(1)} kWh`}
        />
        <SliderField
          label="Puissance de charge"
          value={chargerPowerKw}
          minimumValue={1.4}
          maximumValue={22}
          step={0.1}
          onValueChange={setChargerPowerKw}
          formatValue={(v) => `${v.toFixed(1)} kW`}
        />
        <SliderField
          label="Branché à partir de"
          value={windowStartHour}
          minimumValue={0}
          maximumValue={23}
          step={1}
          onValueChange={setWindowStartHour}
          formatValue={formatHour}
        />
        <SliderField
          label="Doit être prêt à"
          value={windowEndHour}
          minimumValue={0}
          maximumValue={23}
          step={1}
          onValueChange={setWindowEndHour}
          formatValue={formatHour}
        />
      </Card>
    </Screen>
  );
}
