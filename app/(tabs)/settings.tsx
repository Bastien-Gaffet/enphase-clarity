import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCredentialsStore } from "@/store/useCredentialsStore";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { NumberField } from "@/components/ui/NumberField";
import { TextField } from "@/components/ui/TextField";

function SectionLabel({ children }: { children: string }) {
  const { colors, type, space } = useTheme();
  return (
    <Text style={[type.label, { color: colors.textMuted, marginBottom: space.sm }]}>{children.toUpperCase()}</Text>
  );
}

export default function SettingsScreen() {
  const { colors, space } = useTheme();
  const {
    dataSource,
    setDataSource,
    tariff,
    setTariff,
    investment,
    setInvestment,
    evCharger,
    setEvCharger,
    enphaseSystemId,
    setEnphaseSystemId,
  } = useSettingsStore();
  const { credentials, save: saveCredentials } = useCredentialsStore();

  const [apiKey, setApiKey] = useState(credentials?.apiKey ?? "");
  const [clientId, setClientId] = useState(credentials?.clientId ?? "");
  const [clientSecret, setClientSecret] = useState(credentials?.clientSecret ?? "");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.page }}
      contentContainerStyle={{ padding: space.lg, paddingTop: space.xxl, gap: space.lg }}
    >
      <ScreenHeader title="Réglages" subtitle="Contrat, installation et connexion Enphase" />

      <Card style={{ gap: space.md }}>
        <SectionLabel>Source de données</SectionLabel>
        <Segmented
          value={dataSource}
          onChange={setDataSource}
          options={[
            { value: "mock", label: "Démo" },
            { value: "live", label: "Enphase en direct" },
          ]}
        />
      </Card>

      <Card style={{ gap: space.lg }}>
        <SectionLabel>Contrat d'électricité</SectionLabel>
        <NumberField label="Prix heures pleines" value={tariff.hpPricePerKwh} unit="€/kWh"
          onChangeValue={(v) => setTariff({ hpPricePerKwh: v })} />
        <NumberField label="Prix heures creuses" value={tariff.hcPricePerKwh} unit="€/kWh"
          onChangeValue={(v) => setTariff({ hcPricePerKwh: v })} />
        <TextField
          label="Début heures creuses"
          value={tariff.hcWindows[0]?.start ?? "22:00"}
          onChangeText={(v) => setTariff({ hcWindows: [{ start: v, end: tariff.hcWindows[0]?.end ?? "06:00" }] })}
          placeholder="22:00"
        />
        <TextField
          label="Fin heures creuses"
          value={tariff.hcWindows[0]?.end ?? "06:00"}
          onChangeText={(v) => setTariff({ hcWindows: [{ start: tariff.hcWindows[0]?.start ?? "22:00", end: v }] })}
          placeholder="06:00"
        />
        <NumberField label="Abonnement mensuel" value={tariff.subscriptionMonthlyEUR} unit="€/mois"
          onChangeValue={(v) => setTariff({ subscriptionMonthlyEUR: v })} />
        <NumberField label="Prix de rachat du surplus" value={tariff.surplusSellPricePerKwh} unit="€/kWh"
          onChangeValue={(v) => setTariff({ surplusSellPricePerKwh: v })} />
      </Card>

      <Card style={{ gap: space.lg }}>
        <SectionLabel>Installation solaire</SectionLabel>
        <NumberField label="Prix total" value={investment.totalPriceEUR} unit="€"
          onChangeValue={(v) => setInvestment({ totalPriceEUR: v })} />
        <NumberField label="Mensualité (si financé)" value={investment.monthlyPaymentEUR} unit="€/mois"
          onChangeValue={(v) => setInvestment({ monthlyPaymentEUR: v })} />
        <NumberField label="Durée du prêt" value={investment.loanTermMonths} unit="mois"
          onChangeValue={(v) => setInvestment({ loanTermMonths: v })} />
        <TextField
          label="Date de mise en service"
          value={investment.commissionedOn.slice(0, 10)}
          onChangeText={(v) => {
            const d = new Date(v);
            if (!Number.isNaN(d.getTime())) setInvestment({ commissionedOn: d.toISOString() });
          }}
          placeholder="AAAA-MM-JJ"
        />
      </Card>

      <Card style={{ gap: space.lg }}>
        <SectionLabel>Véhicule électrique</SectionLabel>
        <NumberField label="Puissance du chargeur" value={evCharger.chargerPowerKw} unit="kW"
          onChangeValue={(v) => setEvCharger({ chargerPowerKw: v })} />
        <NumberField label="Capacité batterie" value={evCharger.batteryCapacityKwh} unit="kWh"
          onChangeValue={(v) => setEvCharger({ batteryCapacityKwh: v })} />
      </Card>

      {dataSource === "live" ? (
        <Card style={{ gap: space.lg }}>
          <SectionLabel>Connexion Enphase Enlighten</SectionLabel>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            Identifiants issus de ton compte développeur sur developer-v4.enphase.com. Stockés uniquement
            sur cet appareil (Secure Store).
          </Text>
          <TextField label="Clé API" value={apiKey} onChangeText={setApiKey} placeholder="api_key" />
          <TextField label="Client ID" value={clientId} onChangeText={setClientId} placeholder="client_id" />
          <TextField label="Client Secret" value={clientSecret} onChangeText={setClientSecret} secure placeholder="client_secret" />
          <TextField label="System ID" value={enphaseSystemId} onChangeText={setEnphaseSystemId} placeholder="123456" />
          <View>
            <Text
              onPress={() =>
                saveCredentials({
                  apiKey,
                  clientId,
                  clientSecret,
                  accessToken: credentials?.accessToken ?? "",
                  refreshToken: credentials?.refreshToken ?? "",
                  expiresAt: credentials?.expiresAt ?? 0,
                  systemId: enphaseSystemId,
                })
              }
              style={{
                color: colors.page,
                backgroundColor: colors.textPrimary,
                textAlign: "center",
                paddingVertical: space.md,
                borderRadius: 12,
                fontWeight: "700",
                overflow: "hidden",
              }}
            >
              Enregistrer les identifiants
            </Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            La connexion OAuth (échange du code d'autorisation contre un jeton) doit être finalisée une
            première fois via le flux navigateur d'Enphase — le jeton et son renouvellement sont ensuite
            gérés automatiquement par l'app.
          </Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}
