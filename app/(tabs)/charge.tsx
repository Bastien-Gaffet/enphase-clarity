import React, { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { useSettingsStore } from "@/store/useSettingsStore";
import { simulateEvCharging } from "@/lib/calculations/evCharging";
import { forecastSolarSurplusByHour } from "@/lib/enphase/mock";
import { isHeureCreuse } from "@/lib/calculations/tariff";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { SliderField } from "@/components/ui/SliderField";
import { StatTile } from "@/components/charts/StatTile";
import { HourlyBarChart } from "@/components/charts/HourlyBarChart";
import { Legend } from "@/components/charts/Legend";

export default function ChargeScreen() {
  const { colors, space } = useTheme();
  const { tariff, mockSite, evCharger } = useSettingsStore();

  const [energyNeededKwh, setEnergyNeededKwh] = useState(Math.round(evCharger.batteryCapacityKwh * 0.5));
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

  const scheduledHours = new Set(plan.schedule.map((s) => s.hour));
  const bars = Array.from({ length: 24 }, (_, hour) => {
    const at = new Date();
    at.setHours(hour, 0, 0, 0);
    const hc = isHeureCreuse(at, tariff);
    const solar = solarSurplusByHour[hour] > 0.05;
    const color = solar ? colors.energy.production : hc ? colors.energy.heuresCreuses : colors.energy.heuresPleines;
    return {
      hour,
      value: hc ? tariff.hcPricePerKwh : tariff.hpPricePerKwh,
      color,
      highlighted: scheduledHours.has(hour),
    };
  });

  const totalFromSolarKwh = plan.schedule.reduce((sum, s) => sum + s.fromSolarKwh, 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.page }}
      contentContainerStyle={{ padding: space.lg, paddingTop: space.xxl, gap: space.lg }}
    >
      <ScreenHeader title="Charge du véhicule" subtitle="Optimise le coût de la recharge" />

      <Card style={{ gap: space.lg }}>
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
          formatValue={(v) => `${String(Math.round(v)).padStart(2, "0")}h`}
        />
        <SliderField
          label="Disponible jusqu'à"
          value={windowEndHour}
          minimumValue={0}
          maximumValue={23}
          step={1}
          onValueChange={setWindowEndHour}
          formatValue={(v) => `${String(Math.round(v)).padStart(2, "0")}h`}
        />
      </Card>

      <Card>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "600", letterSpacing: 0.4 }}>
          COÛT PAR HEURE — PLAGE DE CHARGE
        </Text>
        <View style={{ marginTop: space.md, alignItems: "center" }}>
          <HourlyBarChart data={bars} width={320} height={100} />
        </View>
        <Legend
          items={[
            { label: "Surplus solaire", color: colors.energy.production },
            { label: "Heures creuses", color: colors.energy.heuresCreuses },
            { label: "Heures pleines", color: colors.energy.heuresPleines },
          ]}
        />
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: space.md }}>
          Heures pleines colorées = plan recommandé.
        </Text>
      </Card>

      <Card>
        <View style={{ flexDirection: "row", gap: space.lg }}>
          <StatTile label="Coût optimisé" value={plan.totalCostEUR.toFixed(2)} unit="€" color={colors.status.good} />
          <StatTile
            label="Économie vs charge immédiate"
            value={plan.savingsEUR.toFixed(2)}
            unit="€"
            color={colors.energy.evCharging}
          />
        </View>
        <View style={{ flexDirection: "row", gap: space.lg, marginTop: space.lg }}>
          <StatTile
            label="Depuis le solaire"
            value={totalFromSolarKwh.toFixed(1)}
            unit="kWh"
            color={colors.energy.production}
          />
          <StatTile
            label="Départ recommandé"
            value={plan.recommendedStartHours.length ? `${plan.recommendedStartHours[0]}h` : "—"}
          />
        </View>
      </Card>
    </ScrollView>
  );
}
