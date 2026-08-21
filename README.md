# Enphase Clarity

Application mobile (React Native / Expo) qui reprend les données de ton
installation **Enphase Enlighten** et les présente de façon claire, directe et
pensée pour prendre des décisions — pas juste pour regarder des courbes.

Construite dans une approche *design-system-first* : palette validée pour
l'accessibilité (contraste et daltonisme), typographie unique, aucune icône
générique ni dégradé décoratif — chaque couleur porte un sens (production,
réseau, heures creuses/pleines, etc.) et reste identique sur tous les écrans.

## Fonctionnalités

- **Tableau de bord temps réel** — production, consommation, import/export
  réseau, anneau d'autonomie, courbe du jour.
- **Économies** — répartition heures creuses / heures pleines, revente du
  surplus, progression de l'amortissement des panneaux avec date estimée.
- **Charge du véhicule électrique** — simulateur qui trouve les heures les
  moins chères pour charger (surplus solaire gratuit → heures creuses →
  heures pleines), avec puissance de charge et fenêtre horaire réglables.
- **Simulation** — scénarios "et si" : puissance de panneaux, kilométrage
  quotidien du véhicule, impact sur le solde mensuel et l'amortissement.
- **Réglages** — contrat d'électricité (prix HP/HC, abonnement, rachat de
  surplus), coût de l'installation (comptant ou financé), identifiants
  Enphase.

## Stack technique

- [Expo](https://expo.dev) + [Expo Router](https://docs.expo.dev/router/introduction/) (React Native, TypeScript)
- [Zustand](https://github.com/pmndrs/zustand) pour l'état (réglages
  persistés via AsyncStorage, identifiants Enphase via `expo-secure-store`)
- Graphiques en SVG natif (`react-native-svg`) — aucune librairie de charts
  tierce, tracés au pixel près pour un rendu net en clair/sombre
- Client Enphase Enlighten API v4 (OAuth2 + refresh de jeton) dans
  `lib/enphase/client.ts`

## Architecture

```
app/(tabs)/        écrans (tableau de bord, économies, charge, simulation, réglages)
theme/              tokens de design (couleurs, typo, espacements)
lib/calculations/   moteur de calcul pur (tarifs HP/HC, amortissement, charge VE)
lib/enphase/        client API Enphase + générateur de données de démo
store/               état applicatif (Zustand)
components/charts/   primitives graphiques SVG (anneau, sparkline, barres horaires)
components/ui/       primitives d'interface (carte, champ, slider, segmented control)
```

Le moteur de calcul (`lib/calculations`) est indépendant de l'UI et de la
source de données : il prend des intervalles d'énergie normalisés en entrée,
qu'ils viennent de l'API Enphase ou du générateur de démo.

## Démarrer

```bash
npm install
npm run web       # ou: npm run ios / npm run android
```

L'app démarre en **mode Démo** (données simulées réalistes : courbe solaire
en cloche, pics de consommation matin/soir) — utilisable immédiatement sans
compte Enphase.

## Connecter tes vraies données Enphase

1. Crée une app sur [developer-v4.enphase.com](https://developer-v4.enphase.com)
   pour obtenir une clé API, un `client_id` et un `client_secret`.
2. Récupère un jeton d'accès via le flux OAuth2 (autorisation navigateur),
   puis renseigne-le avec le `system_id` de ton installation dans
   **Réglages → Connexion Enphase Enlighten**.
3. Bascule la source de données sur **Enphase en direct**.

Les noms de champs de l'API v4 (`rgm_stats`, `summary`, …) suivent la
documentation publique Enphase — à vérifier contre les réponses réelles de
ton système, Enphase ayant fait évoluer ces formats par le passé.

## Limites connues / pistes

- L'écran Économies extrapole l'amortissement à partir du rythme
  d'économie actuel (pas encore d'historique multi-jours en mode direct).
- Le flux OAuth2 (échange du code d'autorisation) est à finaliser côté
  client — le rafraîchissement de jeton est déjà géré une fois le premier
  jeton obtenu.
- Notifications push (ex. "commence à charger la voiture maintenant") non
  implémentées.
