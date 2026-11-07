import React, { useMemo } from "react";
import { View } from "react-native";
import { useEnergyStore } from "@/store/useEnergyStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { computeSavings, isHeureCreuse } from "@/lib/calculations/tariff";
import { Screen } from "@/components/core/Screen";
import { Surface } from "@/components/core/Surface";
import { Txt } from "@/components/core/Txt";
import { Hero } from "@/components/core/Hero";
import { Chip, SectionHeader, StatBlock } from "@/components/core/Blocks";
import { Frame } from "@/components/viz/Frame";
import { EnergyFlow } from "@/components/viz/EnergyFlow";
import { DayCurve } from "@/components/viz/DayCurve";
import { Legend } from "@/components/viz/Meters";
import { useTheme } from "@/theme/useTheme";

function kw(value: number): string {
  if (!Number.isFinite(value)) return "0.00";
  return value.toFixed(value < 10 ? 2 : 1);
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
  const producedKwh = useMemo(
    () => todayIntervals.reduce((sum, i) => sum + i.productionKwh, 0),
    [todayIntervals]
  );
  const consumedKwh = useMemo(
    () => todayIntervals.reduce((sum, i) => sum + i.consumptionKwh, 0),
    [todayIntervals]
  );

  const productionKw = snapshot?.productionKw ?? 0;
  const consumptionKw = snapshot?.consumptionKw ?? 0;
  const gridKw = snapshot?.gridKw ?? 0;
  const importing = gridKw > 0.05;
  const exporting = gridKw < -0.05;
  const inHc = isHeureCreuse(new Date(), tariff);

  return (
    <Screen title="Direct" onRefresh={refresh} refreshing={loading}>
      <Hero
        label="Production maintenant"
        value={kw(productionKw)}
        unit="kW"
        valueColor={productionKw > 0.05 ? colors.energy.production : colors.ink.faint}
        caption={
          exporting
            ? `Tu revends ${kw(-gridKw)} kW au réseau.`
            : importing
            ? `Tu tires ${kw(gridKw)} kW du réseau.`
            : "Tu es à l'équilibre : rien n'entre, rien ne sort."
        }
      >
        <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap", marginTop: space.xs }}>
          <Chip
            label={exporting ? "Surplus revendu" : importing ? "Import réseau" : "Autonome"}
            color={
              exporting ? colors.energy.surplus : importing ? colors.status.warning : colors.status.good
            }
            icon={exporting ? "arrow-up-circle" : importing ? "flash" : "shield-checkmark"}
          />
          <Chip
            label={inHc ? "Heures creuses" : "Heures pleines"}
            color={inHc ? colors.energy.heuresCreuses : colors.energy.heuresPleines}
            icon="time"
          />
        </View>
      </Hero>

      {error ? (
        <Surface>
          <Txt variant="body" tone="critical">
            {error}
          </Txt>
        </Surface>
      ) : null}

      <Surface gap={space.sm}>
        <SectionHeader>Où va l'énergie</SectionHeader>
        <Frame>
          {(width) => (
            <EnergyFlow
              width={width}
              productionKw={productionKw}
              consumptionKw={consumptionKw}
              gridKw={gridKw}
            />
          )}
        </Frame>
      </Surface>

      <Surface gap={space.md}>
        <SectionHeader>Courbe du jour</SectionHeader>
        <Frame height={150}>
          {(width) => (
            <DayCurve
              width={width}
              series={[
                { values: productionCurve, color: colors.energy.production, filled: true },
                { values: consumptionCurve, color: colors.energy.consumption },
              ]}
            />
          )}
        </Frame>
        <Legend
          items={[
            { label: "Production", color: colors.energy.production },
            { label: "Consommation", color: colors.energy.consumption },
          ]}
        />
        <View style={{ flexDirection: "row", gap: space.lg }}>
          <StatBlock label="Produit" value={producedKwh.toFixed(1)} unit="kWh" caption="depuis minuit" />
          <StatBlock label="Consommé" value={consumedKwh.toFixed(1)} unit="kWh" caption="depuis minuit" />
        </View>
      </Surface>

      <Surface gap={space.md}>
        <SectionHeader>Aujourd'hui</SectionHeader>
        <View style={{ flexDirection: "row", gap: space.lg }}>
          <StatBlock
            label="Autonomie"
            value={`${Math.round(savings.autonomyRatio * 100)}`}
            unit="%"
            color={colors.status.good}
            caption="de ta conso couverte"
          />
          <StatBlock
            label="Économisé"
            value={savings.totalSavingsEUR.toFixed(2)}
            unit="€"
            color={colors.brand.highlight}
            caption="face au tout-réseau"
          />
        </View>
      </Surface>
    </Screen>
  );
}
