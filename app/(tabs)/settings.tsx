import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useTheme } from "@/theme/useTheme";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCredentialsStore } from "@/store/useCredentialsStore";
import { EnphaseClient } from "@/lib/enphase/client";
import { buildAuthorizeUrl, exchangeAuthorizationCode, extractAuthorizationCode } from "@/lib/enphase/oauth";
import type { EnphaseSystem } from "@/lib/enphase/types";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { NumberField } from "@/components/ui/NumberField";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";

WebBrowser.maybeCompleteAuthSession();

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
  const [connecting, setConnecting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [systems, setSystems] = useState<EnphaseSystem[]>([]);
  const [loadingSystems, setLoadingSystems] = useState(false);

  const isConnected = Boolean(credentials?.accessToken);
  const redirectUri = AuthSession.makeRedirectUri({ scheme: "enphaseclarity" });

  async function connectToEnphase() {
    setAuthError(null);
    if (!clientId || !clientSecret) {
      setAuthError("Renseigne Client ID et Client Secret avant de te connecter.");
      return;
    }
    setConnecting(true);
    try {
      const authUrl = buildAuthorizeUrl(clientId, redirectUri);
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type !== "success" || !("url" in result)) {
        setConnecting(false);
        return;
      }

      const code = extractAuthorizationCode(result.url);
      if (!code) {
        setAuthError("Aucun code d'autorisation reçu — connexion annulée ou refusée.");
        setConnecting(false);
        return;
      }

      const token = await exchangeAuthorizationCode(clientId, clientSecret, redirectUri, code);
      const nextCreds = {
        apiKey,
        clientId,
        clientSecret,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        expiresAt: token.expiresAt,
        systemId: enphaseSystemId,
      };
      await saveCredentials(nextCreds);

      setLoadingSystems(true);
      const client = new EnphaseClient(nextCreds, saveCredentials);
      const { systems: fetchedSystems } = await client.listSystems();
      setSystems(fetchedSystems);
      if (!enphaseSystemId && fetchedSystems[0]) {
        setEnphaseSystemId(String(fetchedSystems[0].system_id));
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Connexion à Enphase impossible.");
    } finally {
      setConnecting(false);
      setLoadingSystems(false);
    }
  }

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
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <SectionLabel>Connexion Enphase Enlighten</SectionLabel>
            <Pill label={isConnected ? "Connecté" : "Non connecté"} tone={isConnected ? "good" : "neutral"} />
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
            Clé API, Client ID et Client Secret viennent de ton app sur developer-v4.enphase.com. Stockés
            uniquement sur cet appareil.
          </Text>
          <TextField label="Clé API" value={apiKey} onChangeText={setApiKey} placeholder="api_key" />
          <TextField label="Client ID" value={clientId} onChangeText={setClientId} placeholder="client_id" />
          <TextField label="Client Secret" value={clientSecret} onChangeText={setClientSecret} secure placeholder="client_secret" />

          <View>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: space.xs }}>
              Ajoute cette URI de redirection dans les réglages de ton app Enphase :
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontFamily: "monospace" }} selectable>
              {redirectUri}
            </Text>
          </View>

          <Button
            label={isConnected ? "Se reconnecter à Enphase" : "Se connecter à Enphase"}
            onPress={connectToEnphase}
            loading={connecting}
          />

          {authError ? <Text style={{ color: colors.status.critical, fontSize: 13 }}>{authError}</Text> : null}

          {systems.length > 0 ? (
            <View style={{ gap: space.sm }}>
              <Text style={[{ color: colors.textMuted, fontSize: 12, fontWeight: "600", letterSpacing: 0.4 }]}>
                INSTALLATION
              </Text>
              {systems.map((sys) => {
                const selected = String(sys.system_id) === enphaseSystemId;
                return (
                  <Text
                    key={sys.system_id}
                    onPress={() => setEnphaseSystemId(String(sys.system_id))}
                    style={{
                      color: selected ? colors.textPrimary : colors.textSecondary,
                      fontWeight: selected ? "700" : "400",
                      paddingVertical: space.xs,
                    }}
                  >
                    {selected ? "● " : "○ "}
                    {sys.name} ({sys.system_id})
                  </Text>
                );
              })}
            </View>
          ) : (
            <TextField label="System ID" value={enphaseSystemId} onChangeText={setEnphaseSystemId} placeholder="123456" />
          )}

          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            Le jeton d'accès est renouvelé automatiquement en arrière-plan. Recommence la connexion
            uniquement si l'accès a été révoqué côté Enphase.
          </Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}
