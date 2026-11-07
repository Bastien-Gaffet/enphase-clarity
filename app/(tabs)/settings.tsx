import React, { useState } from "react";
import { Pressable, View } from "react-native";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCredentialsStore } from "@/store/useCredentialsStore";
import { EnphaseClient } from "@/lib/enphase/client";
import { buildAuthorizeUrl, exchangeAuthorizationCode, extractAuthorizationCode } from "@/lib/enphase/oauth";
import type { EnphaseSystem } from "@/lib/enphase/types";
import { Screen } from "@/components/core/Screen";
import { Surface } from "@/components/core/Surface";
import { Txt } from "@/components/core/Txt";
import { Chip, SectionHeader } from "@/components/core/Blocks";
import { Icon } from "@/components/core/Icon";
import { Button, NumberField, Segmented, TextField } from "@/components/core/Controls";
import { TouWindowsEditor } from "@/components/core/TouWindowsEditor";
import { useTheme } from "@/theme/useTheme";

WebBrowser.maybeCompleteAuthSession();

/** Two fields on one row, each able to shrink below its content. */
function Row({ children }: { children: React.ReactNode }) {
  const { space } = useTheme();

  return (
    <View style={{ flexDirection: "row", gap: space.md }}>
      {React.Children.map(children, (child) => (
        <View style={{ flex: 1, minWidth: 0 }}>{child}</View>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const { colors, space } = useTheme();
  const {
    dataSource,
    setDataSource,
    themePreference,
    setThemePreference,
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
      const result = await WebBrowser.openAuthSessionAsync(
        buildAuthorizeUrl(clientId, redirectUri),
        redirectUri
      );
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
    <Screen title="Réglages">
      <Surface gap={space.md}>
        <SectionHeader>Source de données</SectionHeader>
        <Segmented
          value={dataSource}
          onChange={setDataSource}
          options={[
            { value: "mock", label: "Démo" },
            { value: "live", label: "Mes données" },
          ]}
        />
        <Txt variant="caption" tone="faint">
          {dataSource === "mock"
            ? "Données simulées réalistes — pour explorer sans compte Enphase."
            : "Lit ton installation réelle via l'API Enphase Enlighten."}
        </Txt>
      </Surface>

      <Surface gap={space.md}>
        <SectionHeader>Apparence</SectionHeader>
        <Segmented
          value={themePreference}
          onChange={setThemePreference}
          options={[
            { value: "system", label: "Système" },
            { value: "light", label: "Clair" },
            { value: "dark", label: "Sombre" },
          ]}
        />
        <Txt variant="caption" tone="faint">
          « Système » suit le réglage de ton téléphone.
        </Txt>
      </Surface>

      <Surface gap={space.lg}>
        <SectionHeader>Tarifs du contrat</SectionHeader>
        <Row>
          <NumberField
            label="Heures pleines"
            unit="€/kWh"
            value={tariff.hpPricePerKwh}
            onChangeValue={(v) => setTariff({ hpPricePerKwh: v })}
          />
          <NumberField
            label="Heures creuses"
            unit="€/kWh"
            value={tariff.hcPricePerKwh}
            onChangeValue={(v) => setTariff({ hcPricePerKwh: v })}
          />
        </Row>
        <Row>
          <NumberField
            label="Abonnement"
            unit="€/mois"
            value={tariff.subscriptionMonthlyEUR}
            onChangeValue={(v) => setTariff({ subscriptionMonthlyEUR: v })}
          />
          <NumberField
            label="Rachat surplus"
            unit="€/kWh"
            value={tariff.surplusSellPricePerKwh}
            onChangeValue={(v) => setTariff({ surplusSellPricePerKwh: v })}
          />
        </Row>
      </Surface>

      <Surface gap={space.md}>
        <SectionHeader>Plages heures creuses</SectionHeader>
        <TouWindowsEditor windows={tariff.hcWindows} onChange={(hcWindows) => setTariff({ hcWindows })} />
      </Surface>

      <Surface gap={space.lg}>
        <SectionHeader>Installation solaire</SectionHeader>
        <NumberField
          label="Prix total"
          unit="€"
          value={investment.totalPriceEUR}
          onChangeValue={(v) => setInvestment({ totalPriceEUR: v })}
        />
        <Row>
          <NumberField
            label="Mensualité"
            unit="€"
            value={investment.monthlyPaymentEUR}
            onChangeValue={(v) => setInvestment({ monthlyPaymentEUR: v })}
          />
          <NumberField
            label="Durée du prêt"
            unit="mois"
            value={investment.loanTermMonths}
            onChangeValue={(v) => setInvestment({ loanTermMonths: v })}
          />
        </Row>
        <TextField
          label="Mise en service"
          value={investment.commissionedOn.slice(0, 10)}
          onChangeText={(v) => {
            const d = new Date(v);
            if (!Number.isNaN(d.getTime())) setInvestment({ commissionedOn: d.toISOString() });
          }}
          placeholder="AAAA-MM-JJ"
        />
      </Surface>

      <Surface gap={space.lg}>
        <SectionHeader>Véhicule électrique</SectionHeader>
        <Row>
          <NumberField
            label="Puissance"
            unit="kW"
            value={evCharger.chargerPowerKw}
            onChangeValue={(v) => setEvCharger({ chargerPowerKw: v })}
          />
          <NumberField
            label="Batterie"
            unit="kWh"
            value={evCharger.batteryCapacityKwh}
            onChangeValue={(v) => setEvCharger({ batteryCapacityKwh: v })}
          />
        </Row>
      </Surface>

      {dataSource === "live" ? (
        <Surface gap={space.lg}>
          <SectionHeader
            right={
              <Chip
                label={isConnected ? "Connecté" : "Non connecté"}
                color={isConnected ? colors.status.good : colors.ink.muted}
                icon={isConnected ? "checkmark-circle" : "ellipse-outline"}
              />
            }
          >
            Connexion Enphase
          </SectionHeader>

          <Txt variant="caption" tone="secondary">
            Identifiants créés sur developer-v4.enphase.com. Stockés uniquement sur cet appareil.
          </Txt>

          <TextField label="Clé API" value={apiKey} onChangeText={setApiKey} placeholder="api_key" />
          <TextField label="Client ID" value={clientId} onChangeText={setClientId} placeholder="client_id" />
          <TextField
            label="Client Secret"
            value={clientSecret}
            onChangeText={setClientSecret}
            secure
            placeholder="client_secret"
          />

          <View style={{ gap: 4 }}>
            <Txt variant="overline" tone="muted">
              URI DE REDIRECTION À DÉCLARER CÔTÉ ENPHASE
            </Txt>
            <Txt variant="caption" tone="highlight" selectable>
              {redirectUri}
            </Txt>
          </View>

          <Button
            label={isConnected ? "Se reconnecter" : "Se connecter à Enphase"}
            icon="log-in"
            onPress={connectToEnphase}
            loading={connecting}
          />

          {authError ? (
            <Txt variant="caption" tone="critical">
              {authError}
            </Txt>
          ) : null}

          {systems.length > 0 ? (
            <View style={{ gap: space.sm }}>
              <SectionHeader>Installation</SectionHeader>
              {systems.map((sys) => {
                const selected = String(sys.system_id) === enphaseSystemId;
                return (
                  <Pressable
                    key={sys.system_id}
                    onPress={() => setEnphaseSystemId(String(sys.system_id))}
                    style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: 6 }}
                  >
                    <Icon
                      name={selected ? "radio-button-on" : "radio-button-off"}
                      size={17}
                      color={selected ? colors.brand.highlight : colors.ink.faint}
                    />
                    <Txt
                      variant="body"
                      tone={selected ? "primary" : "secondary"}
                      numberOfLines={1}
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      {sys.name}
                    </Txt>
                    <Txt variant="caption" tone="faint" tabular>
                      {sys.system_id}
                    </Txt>
                  </Pressable>
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
        </Surface>
      ) : null}
    </Screen>
  );
}
