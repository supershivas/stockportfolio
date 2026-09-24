@.claude/conventions.md

# stockportfolio

## Description

Suivi de portefeuille boursier : positions, transactions, dividendes,
indicateurs, analyse de risque, projections, recommandations. Production :
https://stockportfolio-five.vercel.app/. Catégorie : **secondaire**. Cible :
mobile et bureau (PWA :
`public/manifest.webmanifest`, `public/sw.js`).

## Stack

- React 18 + Vite + TypeScript + Tailwind, état dans Zustand
  (`src/store/portfolioStore.ts`), graphiques Recharts.
- Déployé sur Vercel. Fonctions serverless dans `api/` (cours, dividendes,
  fondamentaux, actualités, recherche, portefeuille).
- Sauvegarde du portefeuille : `api/portfolio.js` lit et écrit
  `data/portfolio.json` dans ce dépôt via l'API GitHub (variable
  `GITHUB_TOKEN` sur Vercel). Chaque sauvegarde crée donc un commit
  « Update portfolio data » sur `main`.

## Structure

```
src/App.tsx              Point d'entrée, navigation entre vues
src/components/          Une vue par fichier (Dashboard, Portfolio, …)
src/services/            Données de marché, historique des prix, sauvegarde
src/store/               Store Zustand
src/data/                Données statiques (indices, dividendes, …)
api/                     Fonctions serverless Vercel
data/portfolio.json      Portefeuille sauvegardé (écrit par api/portfolio.js)
src/app-update.js        Copie de design-system/app-update.js (ne pas éditer)
src/app-update.d.ts      Ses types
public/version.json      Version courante — seule source de vérité
public/CHANGELOG.md      Historique (5 dernières versions dans les Réglages)
```

## Version et mises à jour

- Chaque push visible incrémente `public/version.json` et ajoute son entrée en
  tête de `public/CHANGELOG.md`.
- `App.tsx` lance `startUpdateCheck` (rechargement hors saisie, toast
  « Mis à jour en vX.Y.Z »). Roue crantée (sidebar sur ordinateur, en-tête
  sur mobile) → `AppSettings.tsx` : données de marché, export JSON
  (positions et transactions), version, nouveautés.

## Exceptions aux conventions

- Données (section 7) : stockage dans `data/portfolio.json` via l'API GitHub,
  pas Supabase (permis pour une app secondaire).

## Pièges connus

- `node_modules/` (pourtant dans `.gitignore`) et `dist/` sont suivis par
  Git : ne pas y ajouter de changements.
- Avant de pousser, récupérer `main` : l'app y commite elle-même
  `data/portfolio.json` à chaque sauvegarde.
