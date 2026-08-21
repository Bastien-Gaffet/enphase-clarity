import React, { useState } from "react";
import { Text, View } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useTheme } from "@/theme/useTheme";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCredentialsStore } from "@/store/useCredentialsStore";
import { EnphaseClient } from "@/lib/enphase/client";
import { buildAuthorizeUrl, exchangeAuthorizationCode, extractAuthorizationCode } from "@/lib/enphase/oauth";
import type { EnphaseSystem } from "@/lib/enphase/types";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { NumberField } from "@/components/ui/NumberField";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TouWindowsEditor } from "@/components/ui/TouWindowsEditor";

WebBrowser.maybeCompleteAuthSession();

export default function SettingsScreen() {
  const { colors, type, space } = useTheme();
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

      const client = new EnphaseClient(nextCreds, saveCredentials);
      const { systems: fetched } = await client.listSystems();
      setSystems(fetched);
      if (!enphaseSystemId && fetched[0]) setEnphaseSystemId(String(fetched[0].system_id));
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Connexion à Enphase impossible.");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <Screen title="Réglages" subtitle="Contrat, installation et connexion">
      <Card style={{ gap: space.sm }}>
        <SectionLabel>Source de données</SectionLabel>
        <Segmented
          value={dataSource}
          onChange={setDataSource}
          options={[
            { value: "mock", label: "Démo" },
            { value: "live", label: "Mes données" },
          ]}
        />
        <Text style={[type.caption, { color: colors.textMuted }]}>
          {dataSource === "mock"
            ? "Données simulées réalistes — pratique pour explorer sans compte Enphase."
            : "Lit ton installation réelle via l'API Enphase Enlighten."}
        </Text>
      </Card>

      <Card style={{ gap: space.lg }}>
        <SectionLabel>Tarifs du contrat</SectionLabel>
        <View style={{ flexDirection: "row", gap: space.md }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <NumberField
              label="Heures pleines"
              value={tariff.hpPricePerKwh}
              unit="€/kWh"
              onChangeValue={(v) => setTariff({ hpPricePerKwh: v })}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <NumberField
              label="Heures creuses"
              value={tariff.hcPricePerKwh}
              unit="€/kWh"
              onChangeValue={(v) => setTariff({ hcPricePerKwh: v })}
            />
          </View>
        </View>
        <NumberField
          label="Abonnement mensuel"
          value={tariff.subscriptionMonthlyEUR}
          unit="€/mois"
          onChangeValue={(v) => setTariff({ subscriptionMonthlyEUR: v })}
        />
        <NumberField
          label="Rachat du surplus"
          value={tariff.surplusSellPricePerKwh}
          unit="€/kWh"
          onChangeValue={(v) => setTariff({ surplusSellPricePerKwh: v })}
        />
      </Card>

      <Card>
        <SectionLabel>Plages heures creuses</SectionLabel>
        <TouWindowsEditor
          windows={tariff.hcWindows}
          onChange={(hcWindows) => setTariff({ hcWindows })}
        />
      </Card>

      <Card style={{ gap: space.lg }}>
        <SectionLabel>Installation solaire</SectionLabel>
        <NumberField
          label="Prix total"
          value={investment.totalPriceEUR}
          unit="€"
          onChangeValue={(v) => setInvestment({ totalPriceEUR: v })}
        />
        <View style={{ flexDirection: "row", gap: space.md }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <NumberField
              label="Mensualité"
              value={investment.monthlyPaymentEUR}
              unit="€"
              onChangeValue={(v) => setInvestment({ monthlyPaymentEUR: v })}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <NumberField
              label="Durée du prêt"
              value={investment.loanTermMonths}
              unit="mois"
              onChangeValue={(v) => setInvestment({ loanTermMonths: v })}
            />
          </View>
        </View>
        <TextField
          label="Mise en service"
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
        <View style={{ flexDirection: "row", gap: space.md }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <NumberField
              label="Puissance"
              value={evCharger.chargerPowerKw}
              unit="kW"
              onChangeValue={(v) => setEvCharger({ chargerPowerKw: v })}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <NumberField
              label="Batterie"
              value={evCharger.batteryCapacityKwh}
              unit="kWh"
              onChangeValue={(v) => setEvCharger({ batteryCapacityKwh: v })}
            />
          </View>
        </View>
      </Card>

      {dataSource === "live" ? (
        <Card style={{ gap: space.lg }}>
          <SectionLabel right={<Pill label={isConnected ? "Connecté" : "Non connecté"} tone={isConnected ? "good" : "neutral"} />}>
            Connexion Enphase
          </SectionLabel>
          <Text style={[type.caption, { color: colors.textSecondary }]}>
            Identifiants créés sur developer-v4.enphase.com. Stockés uniquement sur cet appareil.
          </Text>
          <TextField label="Clé API" value={apiKey} onChangeText={setApiKey} placeholder="api_key" />
          <TextField label="Client ID" value={clientId} onChangeText={setClientId} placeholder="client_id" />
          <TextField
            label="Client Secret"
            value={clientSecret}
            onChangeText={setClientSecret}
            secure
            placeholder="client_secret"
          />

          <View>
            <Text style={[type.caption, { color: colors.textMuted, marginBottom: space.xs }]}>
              URI de redirection à déclarer côté Enphase :
            </Text>
            <Text selectable style={[type.caption, { color: colors.brand.highlight }]}>
              {redirectUri}
            </Text>
          </View>

          <Button
            label={isConnected ? "Se reconnecter" : "Se connecter à Enphase"}
            onPress={connectToEnphase}
            loading={connecting}
          />

          {authError ? (
            <Text style={[type.caption, { color: colors.status.critical }]}>{authError}</Text>
          ) : null}

          {systems.length > 0 ? (
            <View style={{ gap: space.sm }}>
              <SectionLabel>Installation</SectionLabel>
              {systems.map((sys) => {
                const selected = String(sys.system_id) === enphaseSystemId;
                return (
                  <Text
                    key={sys.system_id}
                    onPress={() => setEnphaseSystemId(String(sys.system_id))}
                    style={[
                      type.body,
                      {
                        color: selected ? colors.brand.highlight : colors.textSecondary,
                        fontWeight: selected ? "700" : "400",
                        paddingVertical: space.xs,
                      },
                    ]}
                  >
                    {selected ? "● " : "○ "}
                    {sys.name} ({sys.system_id})
                  </Text>
                );
              })}
            </View>
          ) : (
            <TextField
              label="System ID"
              value={enphaseSystemId}
              onChangeText={setEnphaseSystemId}
              placeholder="123456"
            />
          )}
        </Card>
      ) : null}
    </Screen>
  );
}
