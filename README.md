# P-O-N — KAGIS

Logiciel de gestion des opérations KAGIS. Simple. Rapide. Clair. Efficace.

## Démarrage

1. Installer les dépendances :
   ```
   npm install
   ```

2. Lancer le serveur de développement :
   ```
   npm run dev
   ```

3. Ouvrir http://localhost:3000 — vous devriez voir la page "P-O-N — Squelette du projet — prêt à construire".

## Firebase

La configuration Firebase est déjà renseignée dans `src/lib/firebase.ts` (projet `pon-kagis`).

Les règles de sécurité Firestore sont dans `firestore.rules` à la racine. Pour les appliquer à votre projet Firebase :
1. Installer l'outil Firebase CLI : `npm install -g firebase-tools`
2. Se connecter : `firebase login`
3. Lier le projet : `firebase init firestore` (choisir le projet `pon-kagis`, garder le fichier `firestore.rules` existant)
4. Déployer les règles : `firebase deploy --only firestore:rules`

## Déploiement Netlify

1. Pousser ce projet sur un dépôt GitHub
2. Sur Netlify : "Add new site" → "Import an existing project" → connecter le dépôt
3. Netlify détectera automatiquement Next.js grâce au fichier `netlify.toml`
4. Déployer

## Structure

```
src/
├── app/           → pages de l'application (routing Next.js)
├── components/    → composants réutilisables (cartes, formulaires, nav...)
└── lib/           → connexion Firebase, fonctions utilitaires
```

## Prochaines étapes

- [ ] Authentification (connexion / rôles admin-membre)
- [ ] Écran Accueil connecté à Firestore
- [ ] Écran Finance (revenus/dépenses)
- [ ] Écran Stock (produits/quantités)
- [ ] Écran Réunions (planification/comptes-rendus)
- [ ] Écran Paramètres (compte, membres, sécurité)
- [ ] Journal d'activité (logs)
