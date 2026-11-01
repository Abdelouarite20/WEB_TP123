# Rapport d'utilisation de l'IA — TP1, TP2 et TP3

Ce document présente la manière dont j'ai utilisé un assistant IA pendant les trois TP. L'IA m'a surtout servi lorsque je bloquais sur un point technique, pour vérifier une compréhension ou pour m'aider à diagnostiquer une erreur. Je n'ai pas utilisé l'IA comme une source de vérité : les propositions ont été comparées au sujet, au contrat de l'API et au code du projet, puis vérifiées par des tests ou dans le navigateur.

**Assistant utilisé :** CHATGPT
Les preuves d'exécution et les captures sont regroupées dans [docs/preuves/README.md](docs/preuves/README.md). Le compte rendu technique complet se trouve dans [RAPPORT_TP.md](RAPPORT_TP.md).

---

## TP1 — Mission 0 : comprendre l'architecture du projet

### Objectif

Identifier les éléments principaux du frontend et du backend, puis être capable d'expliquer le trajet d'une requête de connexion.

### Pourquoi j'ai utilisé l'IA

Au début, le projet contient plusieurs niveaux : composants Angular, services, intercepteur, guard, API Express et MongoDB. Le point qui pouvait facilement prêter à confusion était de savoir **où passe réellement une requête** et quel fichier a quelle responsabilité.

### Question posée à l'IA (formulation résumée)

> M'aider à retrouver les fichiers importants du projet et à suivre le trajet d'une connexion, sans modifier le backend.

### Ce que l'assistant m'a aidé à faire

L'assistant m'a aidé à repérer le composant racine, les routes, `AuthService`, l'intercepteur JWT, le guard et les routes Express. Il m'a aussi aidé à formaliser le schéma suivant :

`composant → service → HttpClient → API Express → Mongoose/MongoDB`.

Un point important que j'ai retenu est que le guard Angular sert surtout à contrôler la navigation côté client. La vraie sécurité reste côté backend, qui vérifie le JWT.

### Fichiers concernés

`src/main.ts`, `routes.ts`, `auth.service.ts`, `auth.interceptor.ts`, `auth.guard.ts`, `backend/src/app.js`, ainsi que le rapport technique.

### Choix retenus / propositions écartées

Je n'ai pas modifié le backend pour cette mission et je n'ai pas considéré le guard Angular comme une protection serveur.

### Vérification

J'ai conservé uniquement les informations correspondant au code réel et au contrat HTTP. La cartographie finale est détaillée dans [RAPPORT_TP.md — Mission 0](RAPPORT_TP.md#tp1--mission-0--cartographier-lapplication).

### Ce que je sais expliquer maintenant

Je peux expliquer le trajet d'une connexion, le rôle du proxy Angular et la différence entre le guard côté frontend et la vérification du JWT côté backend.

---

## TP1 — Mission 1 : authentification et profil

### Objectif

Finaliser l'inscription, la connexion, la déconnexion et le profil tout en gardant une gestion cohérente du JWT et de l'utilisateur courant.

### Difficulté rencontrée

La partie la moins évidente était la gestion commune du **JWT**, de `currentUser`, du `localStorage` et des réponses `401`. Un token peut être présent dans le navigateur tout en étant invalide ou expiré, donc tester uniquement sa présence n'est pas suffisant.

### Question posée à l'IA (formulation résumée)

> Vérifier la logique de connexion/profil et m'aider à gérer proprement le JWT, `currentUser`, les redirections et le cas d'un 401.

### Aide apportée

L'IA m'a aidé à vérifier que les composants restent responsables de l'interface et que les appels HTTP passent par `AuthService`. Elle m'a aussi aidé sur deux points :

- comprendre la différence entre un **Signal**, qui contient l'état réactif de l'application en mémoire, et `localStorage`, qui permet ici de conserver le token après un rechargement ;
- traiter correctement un `401` sur une route protégée sans confondre ce cas avec un `401` renvoyé lors d'une mauvaise connexion.

La page profil a aussi été vérifiée pour éviter qu'une réponse HTTP tardive mette à jour l'état après la destruction du composant.

### Fichiers concernés

Pages `login`, `register` et `profile`, `AuthService`, l'intercepteur JWT, le composant racine et les tests associés.

### Choix retenus / propositions écartées

Je n'ai pas mis `HttpClient` directement dans les pages et je n'affiche jamais le JWT dans la console ou l'interface.

### Vérification

Les tests couvrent notamment la connexion, le profil, la déconnexion, le guard et l'intercepteur. Les parcours navigateur montrent une connexion acceptée, une connexion refusée, un `GET /api/users/me`, un `PUT /api/users/me` et le retour vers `/login` avec un token invalide.

Preuves : [docs/preuves/README.md](docs/preuves/README.md).

### Ce que je sais expliquer maintenant

Je peux retrouver les fichiers impliqués dans la mise à jour du profil, expliquer pourquoi `localStorage` ne remplace pas un Signal et expliquer pourquoi la validation du JWT doit rester côté serveur.

---

## TP2 — Mission 2 : pagination de la bibliothèque

### Objectif

Afficher une bibliothèque paginée en utilisant réellement la pagination du serveur.

### Difficulté rencontrée

La pagination paraissait simple au départ, mais il y avait un piège : le `MatPaginator` travaille avec un index qui commence à **0**, alors que l'API attend une page qui commence à **1**. Une mauvaise conversion décale toutes les requêtes.

### Question posée à l'IA (formulation résumée)

> M'aider à vérifier la pagination serveur et la correspondance entre le Paginator Angular et les paramètres `page` / `limit` de l'API.

### Aide apportée

L'assistant m'a aidé à vérifier que chaque changement de page déclenche une nouvelle requête vers le serveur et que l'application ne charge pas toutes les pistes pour les découper ensuite côté Angular.

La conversion retenue est simplement :

`page API = pageIndex Angular + 1`.

J'ai également vérifié les états de chargement, d'erreur et de liste vide, ainsi que les bornes de navigation.

### Fichiers concernés

`tracks-page.ts`, `tracks-page.html`, `tracks-page.css`, `track.service.ts`, les dépendances Angular Material et les tests associés.

### Choix retenus / propositions écartées

J'ai gardé la pagination du backend et je n'ai pas récupéré toutes les pistes pour les découper localement dans Angular. Le plugin Mongoose facultatif n'a pas été ajouté.

### Vérification

Les requêtes `GET /api/tracks?page=...&limit=5` ont été contrôlées dans les tests et dans Network. La page 2 a également été testée avec de vraies pistes.

Preuves : [tp2-pagination.png](docs/preuves/tp2-pagination.png) et [network-pagination-upload.png](docs/preuves/network-pagination-upload.png).

### Ce que je sais expliquer maintenant

Je peux expliquer la différence entre pagination serveur et pagination locale, ainsi que le rôle de `total`, `pages`, `pageIndex` et `limit`.

---

## TP2 — Mission 3 : upload et lecture audio

### Objectif

Fiabiliser l'upload et permettre une lecture audio authentifiée sans modifier le contrat de l'API.

### Difficulté rencontrée

La partie qui m'a demandé le plus de réflexion était la lecture authentifiée. Une balise `<audio>` avec une URL directe n'utilise pas automatiquement `HttpClient`, donc l'intercepteur Angular n'ajoute pas forcément le Bearer token.

### Question posée à l'IA (formulation résumée)

> M'aider à comprendre le flux de lecture audio avec `Blob` et `ObjectURL`, puis vérifier le `FormData`, les validations et la libération de la mémoire.

### Aide apportée

L'IA m'a aidé à clarifier le flux :

`GET authentifié → Blob → URL.createObjectURL() → lecteur audio`.

Elle m'a aussi rappelé qu'une `ObjectURL` doit être révoquée lorsqu'elle n'est plus utilisée, sinon le navigateur peut conserver inutilement la ressource en mémoire.

Pour l'upload, j'ai vérifié que le `FormData` contient exactement les champs `audio` et `title`, et que les contrôles frontend restent une aide pour l'utilisateur mais ne remplacent jamais les validations du backend.

### Fichiers concernés

`tracks-page.ts`, son template et ses styles, `track.service.ts` et les tests de lecture/upload.

### Choix retenus / propositions écartées

Je n'ai pas utilisé une URL audio directe qui contournerait l'intercepteur JWT et je n'ai pas ajouté l'option facultative des images de couverture.

### Vérification

L'upload multipart, la lecture MP3 et le comportement mobile ont été testés. Les captures et le relevé des requêtes sont dans le dossier de preuves.

Preuves : [tp2-lecture.png](docs/preuves/tp2-lecture.png), [tp2-mobile.png](docs/preuves/tp2-mobile.png) et [verification-navigateur.json](docs/preuves/verification-navigateur.json).

### Ce que je sais expliquer maintenant

Je peux expliquer la différence entre télécharger un Blob avec `HttpClient`, utiliser une URL HTTP directe dans `<audio>`, le buffering du navigateur et le streaming côté serveur.

---

## TP3 — Mission 5 : suppression d'une piste

### Objectif

Ajouter une suppression sûre côté interface, avec confirmation, retour utilisateur et rafraîchissement de la liste.

### Difficulté rencontrée

Il fallait gérer plusieurs cas en même temps : confirmation avant suppression, blocage du double clic, rafraîchissement de la liste, message utilisateur et cas où la piste a déjà disparu.

### Question posée à l'IA (formulation résumée)

> Vérifier ma logique de suppression et m'aider à traiter correctement le `204`, le `404` et le rafraîchissement de la pagination.

### Aide apportée

L'assistant m'a aidé à garder la requête `DELETE` dans `TrackService` et à laisser le composant gérer l'état de l'interface. J'ai aussi vérifié que masquer le bouton ou utiliser un guard Angular ne protège pas réellement une piste : le backend doit toujours vérifier le propriétaire avec le JWT.

Le cas d'une piste affichée mais déjà supprimée a été prévu afin d'afficher un message propre au lieu de laisser l'interface dans un état incohérent.

### Fichiers concernés

`track.service.ts`, `tracks-page.ts`, le template, les styles, Angular Material SnackBar et les tests associés.

### Choix retenus / propositions écartées

Le `DELETE` n'est jamais déclenché avant confirmation et la sécurité n'est pas déléguée au seul frontend.

### Vérification

La suppression a été testée avec confirmation, réponse `204`, rafraîchissement de la liste et cas `404`.

Preuves : [network-suppression.png](docs/preuves/network-suppression.png), [tp3-suppression.png](docs/preuves/tp3-suppression.png) et [tp3-piste-disparue.png](docs/preuves/tp3-piste-disparue.png).

### Ce que je sais expliquer maintenant

Je peux expliquer pourquoi la suppression passe par un service, pourquoi un `204` n'a pas de corps et pourquoi le backend doit filtrer à la fois sur l'identifiant de la piste et sur son propriétaire.

---

## TP3 — Mission 6 : progression de l'upload

### Objectif

Afficher l'état réel d'un upload et son pourcentage lorsque la taille totale est connue.

### Difficulté rencontrée

Au début, je traitais surtout la réponse finale d'une requête HTTP. Pour afficher une progression, il faut au contraire écouter plusieurs événements pendant l'envoi.

### Question posée à l'IA (formulation résumée)

> M'aider à utiliser les événements HTTP Angular pour calculer la progression d'un upload et gérer le cas où la taille totale n'est pas disponible.

### Aide apportée

L'IA m'a aidé à distinguer les événements `Sent`, `UploadProgress` et `Response`, et à comprendre que l'envoi de 100 % des octets ne signifie pas encore que le serveur a terminé son traitement avec succès.

Le pourcentage n'est calculé que si `total` existe et est strictement positif. Sinon, l'interface indique simplement qu'un envoi est en cours sans inventer une valeur.

### Fichiers concernés

`src/main.ts`, `track.service.ts`, le composant de bibliothèque, son template et les tests d'upload.

### Choix retenus / propositions écartées

Je n'assimile pas 100 % des octets envoyés à un succès serveur et je n'affiche pas un faux pourcentage lorsque `total` est inconnu.

### Vérification

Les événements de progression ont été testés automatiquement et observés pendant un upload réel.

Preuve : [tp3-progression.png](docs/preuves/tp3-progression.png).

### Ce que je sais expliquer maintenant

Je peux expliquer pourquoi une requête avec progression émet plusieurs événements et pourquoi la réponse finale reste nécessaire pour considérer l'upload comme réussi.

---

## TP3 — Mission 7 : tests automatisés

### Objectif

Ajouter des tests frontend utiles, conserver les tests backend existants et vérifier que l'application compile toujours.

### Difficulté rencontrée

La partie la plus nouvelle pour moi était de tester les appels HTTP **sans lancer MongoDB ni le backend**. J'ai aussi rencontré un problème de mock avec `MatSnackBar` dans les tests du composant.

### Question posée à l'IA (formulation résumée)

> M'aider à écrire des tests utiles avec `HttpTestingController`, puis comprendre pourquoi le mock du SnackBar n'était pas pris en compte.

### Aide apportée

L'assistant m'a aidé à construire des tests qui vérifient réellement les URL, méthodes, paramètres, headers et changements d'état. Pour le SnackBar, le provider déclaré dans le composant prenait le dessus sur le mock du test ; l'utilisation d'`overrideProvider` a permis de corriger ce point.

Une autre difficulté pratique venait de PowerShell : `npm.ps1` était bloqué par la politique d'exécution. J'ai utilisé `npm.cmd` pour lancer les commandes sans modifier cette politique.

### Fichiers concernés

Les sept fichiers `.spec.ts`, la configuration de tests Angular et les dépendances nécessaires à l'environnement de test.

### Choix retenus / propositions écartées

Je n'ai pas remplacé les tests backend déjà fournis et je n'ai pas présenté les tests HTTP simulés comme des tests réels de MongoDB Atlas.

### Résultats obtenus

- **32/32 tests frontend réussis** dans 7 fichiers ;
- **2/2 tests backend réussis** ;
- **build Angular réussi** ;
- `git diff --check` sans erreur.

Les sorties réelles sont disponibles dans [tests-frontend.txt](docs/preuves/tests-frontend.txt), [tests-backend.txt](docs/preuves/tests-backend.txt) et [build.txt](docs/preuves/build.txt).

### Ce que je sais expliquer maintenant

Je peux expliquer le rôle de `HttpTestingController`, la différence entre test unitaire et test d'intégration, et pourquoi les tests HTTP du frontend n'ont pas besoin d'une base MongoDB réelle.

---

## Bilan personnel sur l'utilisation de l'IA

L'IA m'a été la plus utile sur les points où plusieurs couches du projet se croisent : authentification, cycle de vie des requêtes, pagination, lecture d'un Blob, progression d'upload et tests asynchrones. Elle m'a permis d'aller plus vite pour identifier certaines erreurs et comparer plusieurs solutions.

Je n'ai pas retenu automatiquement toutes les propositions. Par exemple, je n'ai pas modifié le backend pour les missions principales, je n'ai pas remplacé la pagination serveur par un découpage local et je n'ai pas ajouté les options facultatives qui n'étaient pas nécessaires au sujet.

Le point important pour moi est d'être capable de retrouver le code concerné et d'expliquer les choix réalisés sans dépendre de l'assistant.
