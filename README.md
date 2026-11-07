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
  surplus), **plages heures creuses multiples** (les contrats français en
  ont souvent deux : un bloc de nuit et un créneau de midi), coût de
  l'installation (comptant ou financé), identifiants Enphase.

## Identité visuelle

Marque construite autour d'un éclair frappant un panneau solaire en
perspective, sur une échelle bleu nuit :

| Rôle | Couleur |
|---|---|
| Fond | `#06070E` |
| Accent (boutons, curseurs, réseau) | `#3685B5` |
| Highlight (icône active, chiffres clés) | `#A8F9FF` |

Le logo est un composant SVG (`components/brand/Logo.tsx`) dont les lignes
de grille et le contour de l'éclair se peignent dans la couleur du fond, ce
qui le garde net sur n'importe quelle surface. Les icônes d'application, le
splash et le favicon sont générés depuis ce même tracé.

**L'app est en mode sombre uniquement** (`userInterfaceStyle: "dark"`). La
marque est ancrée sur un quasi-noir, et le thème clair était un reliquat de
neutres chauds qui jurait avec elle : un second thème à moitié tenu vaut
moins qu'un seul assumé. Les tokens restent séparés (marque / surfaces /
encres / données), donc une échelle claire peut revenir sans toucher aux
appels.

## Stack technique

- [Expo](https://expo.dev) + [Expo Router](https://docs.expo.dev/router/introduction/) (React Native, TypeScript)
- [Zustand](https://github.com/pmndrs/zustand) pour l'état (réglages
  persistés via AsyncStorage, identifiants Enphase via `expo-secure-store`)
- Graphiques en SVG natif (`react-native-svg`) — aucune librairie de charts
  tierce, tracés au pixel près
- Client Enphase Enlighten API v4 (OAuth2 + refresh de jeton) dans
  `lib/enphase/client.ts`

## Architecture

```
app/(tabs)/         écrans (direct, économies, charge, simulation, réglages)
theme/              tokens : couleurs, échelle typographique, espacements
lib/calculations/   moteur de calcul pur (tarifs HP/HC, amortissement, charge VE)
lib/enphase/        client API Enphase + générateur de données de démo
store/              état applicatif (Zustand)
components/core/    primitives d'interface (Txt, Surface, Hero, champs, contrôles)
components/viz/     visualisations (flux d'énergie, courbe du jour, jauges)
components/brand/   le logo
```

Le moteur de calcul (`lib/calculations`) est indépendant de l'UI et de la
source de données : il prend des intervalles d'énergie normalisés en entrée,
qu'ils viennent de l'API Enphase ou du générateur de démo. Toute la couche
visuelle a été réécrite en novembre 2026 sans toucher à ce cœur ni à ses
tests.

### Principes de mise en page

- **Un héros par écran** : le chiffre qui compte occupe la pleine largeur
  sans habillage de carte, les détails viennent en cartes en dessous. La
  première version empilait des cartes de poids identique, ce qui aplatissait
  tout.
- **Les graphiques mesurent leur conteneur** (`components/viz/Frame.tsx`) au
  lieu d'une largeur en dur, qui débordait sur les écrans étroits.
- **Pas d'emoji** : des icônes vectorielles, rendues identiquement partout.

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
2. Dans **Réglages**, bascule la source de données sur **Enphase en direct**,
   renseigne la clé API / Client ID / Client Secret, puis ajoute l'URI de
   redirection affichée à l'écran dans les paramètres de ton app Enphase.
3. Appuie sur **Se connecter à Enphase** — ça ouvre le navigateur pour te
   connecter à ton compte Enlighten, puis échange automatiquement le code
   d'autorisation contre un jeton d'accès (stocké et renouvelé tout seul
   ensuite). Choisis ton installation dans la liste qui apparaît.

> Le flux OAuth2 échange le `client_secret` directement depuis l'app — un
> compromis acceptable pour un usage personnel sur ton propre système, mais
> pas pour une app distribuée à d'autres utilisateurs (l'échange devrait
> alors passer par un petit serveur qui garde le secret côté back-end).

Une fois connecté, l'historique se synchronise progressivement en arrière-plan
(depuis la date de mise en service, par lots de 14 jours pour rester sous les
limites de débit de l'API) — l'écran Économies passe automatiquement de
l'estimation à l'historique réel une fois les premiers jours récupérés.

Les noms de champs de l'API v4 (`rgm_stats`, `telemetry/production_meter`,
`telemetry/consumption_meter`, …) suivent la documentation publique Enphase —
à vérifier contre les réponses réelles de ton système, Enphase ayant fait
évoluer ces formats par le passé.

## Tests

```bash
npm test
```

Le moteur de calcul (`lib/calculations`) et l'agrégation d'historique
(`lib/enphase/history.ts`) sont couverts par des tests unitaires Jest —
tarifs HP/HC (dont le passage à minuit), amortissement, optimiseur de charge
VE, et cohérence du cumul par jour avec le calcul direct sur les intervalles.

## Limites connues / pistes

- Le cumul historique applique le tarif *actuel* rétroactivement (le détail
  HP/HC de chaque jour est conservé, mais pas l'évolution du prix du kWh
  dans le temps).
- La synchro d'historique suppose que `production_meter` et
  `consumption_meter` existent tous les deux ; sur une installation avec un
  seul compteur net, elle retombe sur `rgm_stats` (production/consommation
  détaillées non disponibles, seul l'import/export réseau l'est).
- Notifications push (ex. "commence à charger la voiture maintenant") non
  implémentées.
