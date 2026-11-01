# Vérifications et preuves des trois TP

Ce dossier regroupe les captures, sorties de commandes et relevés Network que j'ai gardés pour vérifier le fonctionnement final des TP1, TP2 et TP3.

 J'ai utilisé un assistant IA ponctuellement pour m'aider à comprendre certaines erreurs, retrouver les bons fichiers et vérifier des points techniques (JWT, requêtes HTTP, progression d'upload, `Blob`/`ObjectURL` et tests Angular). Les résultats présents ici correspondent aux exécutions réellement obtenues ; je n'ai pas ajouté de sortie fictive pour compléter le rapport.

## Tests et build

| Commande | Résultat obtenu |
|---|---|
| `npm.cmd test -- --reporters=verbose` dans `frontend-starter` | [32 tests réussis, 7 fichiers, 0 échec](tests-frontend.txt). |
| `npm.cmd test` dans `backend` | [2 tests réussis, 0 échec](tests-backend.txt). |
| `npm.cmd run build` dans `frontend-starter` | [Compilation réussie](build.txt). |
| `git diff --check` | Aucune erreur d'espacement relevée lors de la vérification. |
| `GET http://127.0.0.1:3000/api/health` | [Réponse `200 {"status":"ok"}`](sante-api.json). |

Les tests frontend vérifient notamment les URLs, méthodes, paramètres, corps, headers et changements d'état. Ils couvrent la connexion, l'inscription, le profil, la déconnexion, l'intercepteur, le guard, la pagination, la validation des fichiers, la progression d'upload, la suppression, les erreurs audio et la révocation des `ObjectURL`.

Les tests frontend utilisent des réponses HTTP simulées avec les outils de test Angular. Ils ne remplacent donc pas les essais avec le backend et MongoDB Atlas, ce qui explique les vérifications navigateur ci-dessous.

## Vérifications dans le navigateur

J'ai également vérifié le fonctionnement avec le backend Express fourni et MongoDB Atlas. Le proxy Angular est configuré vers le port 3000. Les captures ont été réalisées en faisant attention à ne pas faire apparaître de mot de passe, de JWT ou d'URI MongoDB.

Le parcours de vérification a validé **19 contrôles sur 19**. Le fichier [verification-navigateur.json](verification-navigateur.json) conserve les méthodes, URLs, statuts et informations utiles des requêtes. Les valeurs sensibles comme les mots de passe et les JWT y sont masquées.

| Contrôle | Résultat obtenu | Preuve |
|---|---|---|
| Inscription et profil | `POST /auth/register` en 201, `GET /users/me` en 200, puis `PUT /users/me` en 200 avec le nom mis à jour | [Profil](tp1-profil.png), [Network](network-auth-profil.png). |
| Connexion correcte / refusée | connexion en 200 avec redirection ; mauvais identifiants en 401 avec message visible | [Refus de connexion](tp1-connexion-refusee.png), relevé JSON. |
| Déconnexion et session invalide | stockage local nettoyé ; requête protégée en 401 puis retour vers `/login` | [Retour connexion](tp1-session-invalide.png), relevé JSON. |
| Pagination serveur | six pistes utilisées pour le test ; requêtes `page=1&limit=5`, puis `page=2&limit=5` | [Page 2](tp2-pagination.png), [Network](network-pagination-upload.png). |
| Upload multipart | réponse 201, champs `audio` et `title`, formulaire vidé et retour à la première page | [Bibliothèque](tp2-bibliotheque.png), relevé JSON. |
| Progression | événements intermédiaires reçus avec un pourcentage entre 0 et 100 et contrôles bloqués pendant l'envoi | [Progression](tp3-progression.png), tableau `uploadProgress` du JSON. |
| Lecture authentifiée | réponse audio 200 en `audio/mpeg`, header d'authentification présent et lecture du MP3 possible | [Lecteur](tp2-lecture.png), relevé JSON. |
| Affichage mobile | test à 390 px sans débordement horizontal constaté | [Cards sur mobile](tp2-mobile.png). |
| Contrôle du propriétaire | un autre utilisateur authentifié obtient 404 en demandant une piste qui ne lui appartient pas | relevé JSON. |
| Validation serveur | requête sans fichier et fichier `text/plain` refusés en 400 | réponses enregistrées dans le relevé JSON. |
| Piste déjà supprimée | suppression préalable puis nouvelle tentative depuis l'interface : 404 géré avec un SnackBar | [Piste disparue](tp3-piste-disparue.png). |
| Suppression normale | confirmation, `DELETE` en 204, SnackBar puis rechargement de la liste | [Succès](tp3-suppression.png), [Network](network-suppression.png). |

Les captures Network viennent de l'inspecteur du navigateur. Le fichier [verification-captures-network.json](verification-captures-network.json) complète les images avec les informations nécessaires pour relire les échanges HTTP.

Pour rendre la progression d'un upload visible, le réseau a été ralenti pendant le test. L'API utilisée reste bien l'API réelle du projet ; le ralentissement sert seulement à mieux observer les événements intermédiaires.

Les requêtes volontairement invalides (fichier absent ou type MIME interdit) servent à vérifier les protections du backend. En utilisation normale, le formulaire Angular bloque déjà plusieurs de ces cas avant l'envoi HTTP.

Les erreurs visibles dans la console pendant ces scénarios correspondent aux réponses 400, 401 ou 404 provoquées volontairement pour tester les cas d'erreur. Je n'ai pas relevé d'exception JavaScript inattendue pendant le parcours final.

Les pistes créées spécialement pour les vérifications finales ont ensuite été supprimées. Les comptes techniques créés pour les essais restent dans la base car l'API fournie ne possède pas de route de suppression d'utilisateur.

## Ce qu'il me reste à préparer pour la restitution

- savoir expliquer les principaux flux sans relire le code : connexion, profil, pagination, upload, lecture et suppression ;
- pouvoir montrer où le JWT est stocké et où il est ajouté aux requêtes ;
- savoir expliquer pourquoi `Blob` + `ObjectURL` est utilisé pour la lecture authentifiée ;
- savoir expliquer la différence entre les tests HTTP simulés et les essais avec le backend réel ;
- si le professeur le demande, relever directement dans l'outil IA le nom exact du modèle et les informations d'usage disponibles, sans inventer un nombre de tokens.
