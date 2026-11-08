import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useHistoryStore } from "@/store/useHistoryStore";
import { usePeriodStats } from "@/hooks/usePeriodStats";
import { PERIODS, PERIOD_TITLES, type Period } from "@/lib/calculations/periods";
import { computeSavingsFromRollups } from "@/lib/enphase/history";
import { computePaybackProgress, netMonthlyCashFlow } from "@/lib/calculations/payback";
import { generateMockRollups } from "@/lib/enphase/mock";
import { Screen } from "@/components/core/Screen";
import { Surface } from "@/components/core/Surface";
import { Txt } from "@/components/core/Txt";
import { Hero } from "@/components/core/Hero";
import { Chip, SectionHeader, StatBlock } from "@/components/core/Blocks";
import { Segmented } from "@/components/core/Controls";
import { Frame } from "@/components/viz/Frame";
import { PeriodBars } from "@/components/viz/PeriodBars";
import { Meter, SplitMeter } from "@/components/viz/Meters";
import { useTheme } from "@/theme/useTheme";

function monthsToText(months: number | null): string {
  if (months === null) return "—";
  if (months <= 0) return "maintenant";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${rest} mois`;
  return `${years} an${years > 1 ? "s" : ""}${rest ? ` et ${rest} mois` : ""}`;
}

const DAY_MS = 86400000;

export default function EconomiesScreen() {
  const { colors, space } = useTheme();
  const [period, setPeriod] = useState<Period>("month");

  const { tariff, investment, dataSource, mockSite } = useSettingsStore();
  const rollupMap = useHistoryStore((s) => s.rollups);
  const historyLoading = useHistoryStore((s) => s.loading);

  const stats = usePeriodStats(period);

  const now = new Date();
  const commissioned = new Date(investment.commissionedOn);

  // Lifetime figures drive the payback bar regardless of the period on screen —
  // amortisation is a property of the installation, not of the chosen window.
  const lifetime = useMemo(() => {
    const real = dataSource === "live" && Object.keys(rollupMap).length > 0;
    const rollups = real
      ? Object.values(rollupMap).sort((a, b) => a.date.localeCompare(b.date))
      : generateMockRollups(commissioned, now, tariff, mockSite);
    const savings = computeSavingsFromRollups(rollups, tariff);
    const days = Math.max(1, rollups.length);
    return { savings, days, real, perMonth: (savings.totalSavingsEUR / days) * 30.4 };
  }, [dataSource, rollupMap, tariff, mockSite, investment.commissionedOn]);

  const payback = useMemo(
    () => computePaybackProgress(investment, lifetime.savings.totalSavingsEUR, lifetime.perMonth, now),
    [investment, lifetime]
  );

  const cashFlow = netMonthlyCashFlow(investment, lifetime.perMonth);
  const isFinanced = investment.monthlyPaymentEUR > 0;
  const done = payback.percentComplete >= 1;

  const days = Math.max(1, Math.round((stats.to.getTime() - stats.from.getTime()) / DAY_MS) + 1);
  const perDay = stats.savings.totalSavingsEUR / days;

  return (
    <Screen title="Économies">
      <Segmented
        value={period}
        onChange={(p) => setPeriod(p as Period)}
        options={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
      />

      <Hero
        label={PERIOD_TITLES[period]}
        value={stats.savings.totalSavingsEUR.toFixed(stats.savings.totalSavingsEUR >= 100 ? 0 : 2)}
        unit="€"
        valueColor={colors.status.good}
        caption={
          period === "day"
            ? `Soit ${stats.savings.selfConsumedKwh.toFixed(1)} kWh que tu n'as pas achetés.`
            : `${days} jours · ${perDay.toFixed(2)} € par jour en moyenne.`
        }
      >
        <View style={{ flexDirection: "row", gap: space.sm, marginTop: space.sm, flexWrap: "wrap" }}>
          <Chip
            label={stats.real ? "Historique réel" : "Données de démo"}
            color={stats.real ? colors.status.good : colors.ink.muted}
            icon={stats.real ? "checkmark-circle" : "flask"}
          />
          {historyLoading ? (
            <Chip label="Synchronisation" color={colors.brand.highlight} icon="cloud-download" />
          ) : null}
        </View>
      </Hero>

      {stats.buckets.length > 1 ? (
        <Surface gap={space.md}>
          <SectionHeader icon="bar-chart">
            {`Économies par ${period === "year" || period === "all" ? "mois" : "jour"}`}
          </SectionHeader>
          <Frame height={130}>
            {(width) => (
              <PeriodBars
                width={width}
                color={colors.status.good}
                data={stats.buckets.map((b, i) => ({
                  label: b.label,
                  value: stats.bucketSavings[i],
                }))}
              />
            )}
          </Frame>
        </Surface>
      ) : null}

      <Surface gap={space.md}>
        <SectionHeader icon="flash">Énergie sur la période</SectionHeader>
        <View style={{ flexDirection: "row", gap: space.lg }}>
          <StatBlock
            label="Produit"
            value={stats.savings.selfConsumedKwh > 0 || stats.rollups.length > 0
              ? stats.rollups.reduce((s, r) => s + r.productionKwh, 0).toFixed(0)
              : "0"}
            unit="kWh"
            color={colors.energy.production}
          />
          <StatBlock
            label="Autoconsommé"
            value={`${Math.round(stats.savings.selfConsumptionRatio * 100)}`}
            unit="%"
            caption="de la production"
          />
        </View>
        <View style={{ flexDirection: "row", gap: space.lg }}>
          <StatBlock
            label="Acheté"
            value={stats.savings.gridCostEUR.toFixed(stats.savings.gridCostEUR >= 100 ? 0 : 2)}
            unit="€"
            color={colors.energy.grid}
          />
          <StatBlock
            label="Revendu"
            value={stats.savings.exportRevenueEUR.toFixed(stats.savings.exportRevenueEUR >= 100 ? 0 : 2)}
            unit="€"
            color={colors.energy.surplus}
            caption={`${stats.savings.exportedKwh.toFixed(0)} kWh exportés`}
          />
        </View>
      </Surface>

      <Surface gap={space.md}>
        <SectionHeader icon="swap-horizontal">Réseau sur la période</SectionHeader>
        <SplitMeter
          segments={[
            {
              label: "Heures pleines",
              value: stats.savings.heuresPleinesKwh,
              color: colors.energy.heuresPleines,
            },
            {
              label: "Heures creuses",
              value: stats.savings.heuresCreusesKwh,
              color: colors.energy.heuresCreuses,
            },
          ]}
          unit="kWh"
        />
      </Surface>

      <Surface gap={space.md}>
        <SectionHeader icon="trending-up">Amortissement de l'installation</SectionHeader>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.sm }}>
          <Txt variant="display" tabular color={done ? colors.status.good : colors.ink.primary}>
            {Math.round(payback.percentComplete * 100)} %
          </Txt>
          <Txt variant="body" tone="secondary" style={{ flexShrink: 1 }} numberOfLines={2}>
            {payback.cumulativeSavingsEUR.toFixed(0)} € sur {payback.totalInvestmentEUR.toFixed(0)} €
          </Txt>
        </View>
        <Meter progress={payback.percentComplete} color={colors.status.good} />
        <Txt variant="body" tone="secondary">
          {done
            ? "Installation amortie — tout ce qui suit est du gain net."
            : `Amorti dans ${monthsToText(payback.estimatedMonthsRemaining)}, au rythme de ${lifetime.perMonth.toFixed(0)} € par mois.`}
        </Txt>
        <Txt variant="caption" tone="faint">
          {lifetime.real
            ? `Calculé sur ${lifetime.days} jours d'historique réel, au tarif actuel.`
            : "Projection sur données de démo — branche ton compte Enphase pour le chiffre réel."}
        </Txt>
      </Surface>

      {isFinanced ? (
        <Surface gap={space.md}>
          <SectionHeader icon="wallet">Trésorerie mensuelle</SectionHeader>
          <View style={{ flexDirection: "row", gap: space.lg }}>
            <StatBlock
              label="Mensualité"
              value={`-${investment.monthlyPaymentEUR.toFixed(0)}`}
              unit="€"
              color={colors.status.critical}
            />
            <StatBlock
              label="Solde net"
              value={`${cashFlow >= 0 ? "+" : ""}${cashFlow.toFixed(0)}`}
              unit="€"
              color={cashFlow >= 0 ? colors.status.good : colors.status.warning}
              caption={cashFlow >= 0 ? "le solaire paie son crédit" : "reste à ta charge"}
            />
          </View>
        </Surface>
      ) : null}
    </Screen>
  );
}
