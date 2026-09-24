@.claude/conventions.md

# stockportfolio

## Description

Suivi de portefeuille boursier : positions, transactions, dividendes,
indicateurs, analyse de risque, projections, recommandations. Production :
https://stockportfolio-five.vercel.app/. Cible : mobile et bureau (PWA :
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
```

## Exceptions aux conventions

- Données (section 7) : stockage dans `data/portfolio.json` via l'API GitHub,
  pas Supabase.

## Pièges connus

- `node_modules/` (pourtant dans `.gitignore`) et `dist/` sont suivis par
  Git : ne pas y ajouter de changements.
- Avant de pousser, récupérer `main` : l'app y commite elle-même
  `data/portfolio.json` à chaque sauvegarde.
