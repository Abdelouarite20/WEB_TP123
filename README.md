# Guitar Practice Cloud — TP1, TP2 et TP3

Ce dépôt regroupe mon travail sur les trois TP Angular consacrés à l'authentification, à la gestion d'une bibliothèque audio et aux tests du frontend.

## Fonctionnalités réalisées

### TP1 — Authentification et profil

- inscription et connexion avec Reactive Forms ;
- validations et messages d'erreur ;
- stockage du JWT et gestion de l'utilisateur courant avec des Signals ;
- déconnexion ;
- protection des routes avec un guard ;
- ajout du JWT aux requêtes protégées avec un intercepteur ;
- lecture et modification du profil ;
- gestion d'un token invalide ou expiré.

### TP2 — Bibliothèque audio

- pagination côté serveur ;
- affichage des pistes sous forme de cards ;
- Angular Material Paginator ;
- upload d'un fichier audio avec validations ;
- lecture authentifiée avec `Blob` et `ObjectURL` ;
- gestion des états de chargement, succès et erreur ;
- interface responsive.

### TP3 — Fiabilisation et tests

- suppression d'une piste avec confirmation ;
- gestion du cas où une piste n'existe plus ;
- SnackBar de succès ou d'erreur ;
- progression réelle de l'upload ;
- blocage des doubles soumissions ;
- tests des services, composants, guard et intercepteur.

## Structure du projet

```text
AngularM1_Miage_2026_2027_TP123/
├── backend/                 API Express / Mongoose fournie
├── frontend-starter/        application Angular
├── docs/preuves/            captures et sorties de tests
├── SUJET_ETUDIANT_TP1.md
├── SUJET_ETUDIANT_TP2.md
├── SUJET_ETUDIANT_TP3.md
├── API_CONTRACT.md
├── ATLAS_SETUP.md
├── RAPPORT_TP.md             compte rendu technique
└── RAPPORT_IA_MODELE.md      utilisation de l'assistant IA
```

## Prérequis

- Node.js **22.22.3 minimum** (ou une version plus récente compatible avec Angular 22) ;
- npm ;
- un compte MongoDB Atlas ;
- Git ;
- un navigateur récent.

La configuration de MongoDB Atlas est expliquée dans [ATLAS_SETUP.md](ATLAS_SETUP.md).

## Installation

### 1. Backend

Depuis la racine du projet :

```bash
cd backend
npm install
```

Créer le fichier `.env` à partir de `.env.example` puis renseigner localement l'URI MongoDB Atlas et le secret JWT.

```bash
cp .env.example .env
npm start
```

Le backend écoute normalement sur :

```text
http://localhost:3000
```

Le fichier `.env` contient des informations sensibles et ne doit pas être publié.

### 2. Frontend

Dans un second terminal :

```bash
cd frontend-starter
npm install
npm start
```

Puis ouvrir :

```text
http://localhost:4200
```

Le proxy Angular envoie les requêtes `/api` vers le backend défini dans `proxy.conf.json`.

## Compte de démonstration

Le backend prépare le compte suivant :

```text
Email : demo@example.com
Mot de passe : Demo1234!
```

Il peut être utilisé pour tester rapidement la connexion et la bibliothèque.

## Fichiers audio de test

Deux fichiers MP3 sont disponibles dans :

```text
frontend-starter/fichiers-audio-de-test/
```

Ils permettent de tester l'upload et la lecture sans devoir chercher un autre fichier.

## Lancer les tests

### Frontend

```bash
cd frontend-starter
npm test
```

La suite actuelle contient **32 tests répartis dans 7 fichiers**.

### Backend

```bash
cd backend
npm test
```

Les **2 tests backend fournis** sont conservés et passent.

### Vérifier le build Angular

```bash
cd frontend-starter
npm run build
```

Le build de production a été exécuté avec succès.

> Sous Windows, si PowerShell bloque `npm.ps1`, les mêmes commandes peuvent être lancées avec `npm.cmd`, par exemple `npm.cmd test`.

## Résultats de validation

Les vérifications réalisées sur la version finale donnent :

- **32/32 tests frontend réussis** ;
- **2/2 tests backend réussis** ;
- **build Angular réussi** ;
- authentification et profil testés avec l'API réelle ;
- pagination serveur observée dans Network ;
- upload multipart fonctionnel ;
- progression de l'upload observée ;
- lecture MP3 authentifiée fonctionnelle ;
- suppression avec réponse `204` et gestion du `404` ;
- interface vérifiée sur une largeur mobile de 390 px.

Les sorties et captures sont regroupées dans [docs/preuves/README.md](docs/preuves/README.md).

## Points techniques importants

### Signal et localStorage

Les Signals servent à maintenir l'état réactif de l'application, par exemple l'utilisateur courant ou les pistes affichées. `localStorage` est utilisé pour conserver le JWT après un rechargement de la page. Les deux ont donc des rôles différents.

### Pagination

La pagination est effectuée côté serveur. Angular envoie `page` et `limit` à l'API à chaque changement de page. Le `MatPaginator` commence à l'index 0 alors que l'API commence à la page 1, d'où la conversion `pageIndex + 1`.

### Lecture audio

Le fichier audio est récupéré avec `HttpClient` sous forme de `Blob`. Une `ObjectURL` est ensuite créée pour alimenter le lecteur `<audio>`. Cette URL est révoquée lorsqu'elle n'est plus utilisée afin d'éviter de conserver inutilement la ressource en mémoire.

### Sécurité

Le guard Angular améliore la navigation, mais il ne remplace jamais la sécurité serveur. Le backend vérifie le JWT et le propriétaire d'une piste avant les opérations protégées, notamment la lecture et la suppression.

## Documentation

- [RAPPORT_TP.md](RAPPORT_TP.md) : explication des missions et des choix techniques ;
- [RAPPORT_IA_MODELE.md](RAPPORT_IA_MODELE.md) : utilisation de l'IA et difficultés rencontrées ;
- [docs/preuves/README.md](docs/preuves/README.md) : captures, tests et vérifications ;
- [API_CONTRACT.md](API_CONTRACT.md) : contrat des endpoints ;
- [ATLAS_SETUP.md](ATLAS_SETUP.md) : configuration MongoDB Atlas.

## Utilisation de l'IA

Un assistant IA a été utilisé comme aide pendant le projet, principalement pour débloquer ou vérifier certains points techniques : gestion du JWT et des `401`, pagination, `Blob`/`ObjectURL`, progression d'upload et tests HTTP Angular.

Les détails sont présentés dans [RAPPORT_IA_MODELE.md](RAPPORT_IA_MODELE.md).
