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
- **Économies** — statistiques par période (jour, semaine, mois, année,
  depuis la mise en service) avec graphique par jour ou par mois, répartition
  heures creuses / heures pleines, revente du surplus, et progression de
  l'amortissement calculée sur toute la durée de vie de l'installation
  indépendamment de la période affichée.
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

### Thèmes clair et sombre

Les deux schémas sont pris en charge, et l'app suit le réglage du système
par défaut (**Réglages → Apparence** permet de forcer Clair ou Sombre).

La palette claire n'est pas la sombre inversée : les surfaces y vont dans
l'autre sens (le fond est le plan le plus foncé, les cartes s'en détachent
en blanchissant), et l'accent comme le highlight y sont assombris — `#3685B5`
et surtout `#A8F9FF` perdent tout contraste sur blanc.

Les composants lisent leurs couleurs via `useTheme()`, jamais par import
direct d'une palette : un import au niveau module fige un schéma au
chargement, et c'est exactement ainsi que la première tentative de thème
clair avait silencieusement pourri. L'audit ci-dessous tourne sur les deux
thèmes pour que le second ne dérive plus sans qu'on le voie.

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
- **Les boîtes se dimensionnent sur leur contenu**, pas sur un ratio : le
  schéma de flux calcule sa hauteur depuis la taille réelle de ses libellés,
  sinon la légende du bas sort de la carte.
- **Pas d'emoji** : des icônes vectorielles, rendues identiquement partout.

## Polices : le piège du build natif

`hooks/useAppFonts.ts` enregistre `Ionicons.font` et la police monospace des
chiffres. **Ne pas retirer cet appel** : sur le web, `@expo/vector-icons`
injecte une `@font-face` et tout s'affiche, alors qu'un APK release dessine
des glyphes vides pour chaque icône. L'oubli est passé deux fois en revue
sans être vu, d'où le test `hooks/__tests__/useAppFonts.test.ts` qui échoue
si l'entrée Ionicons disparaît.

Le chargement n'est jamais bloquant : `useAppFonts()` renvoie `true` aussi en
cas d'échec, car une app sans icônes vaut mieux qu'un écran blanc.

## Audit de mise en page

Relire des captures à l'œil laisse passer les défauts de quelques pixels.
`scripts/layout-audit.js` les mesure : il ouvre chaque écran en 360 et
390 px de large, fait défiler, et vérifie quatre règles.

| Règle | Ce qu'elle attrape |
|---|---|
| `horizontal-overflow` | la page défile latéralement |
| `svg-clipped` | un tracé dépasse de sa propre boîte SVG (trait rogné) |
| `escapes-card` | du contenu sort du bord intérieur de sa carte, ou s'y colle |
| `sibling-overlap` | deux blocs empilés se chevauchent |
| `low-contrast` | texte sous le seuil WCAG AA face à son fond |

```bash
npm run audit:layout        # sur un serveur web déjà lancé (npm run web)
```

Deux précisions qui ont chacune coûté un faux positif :

- la mesure géométrique se fait en pixels écran et non en unités `viewBox`.
  Comparer la `getBBox()` d'un SVG à sa largeur rendue signale à tort toute
  icône mise à l'échelle, et ignore l'épaisseur du trait.
- les polices d'icônes (Ionicons) sont des glyphes texte mais du contenu
  **non textuel** au sens WCAG : le seuil y est 3:1 (1.4.11), pas 4,5:1.

Les trois vérifications (typecheck, tests, audit) tournent à chaque push via
`.github/workflows/checks.yml`.

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
