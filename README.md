# Brief créatif

Assistant en 8 étapes pour préparer un brief créatif. JavaScript sans dépendance, utilisable en page statique (GitHub Pages) ou comme plugin WordPress. Les réponses restent dans le navigateur jusqu'à l'envoi.

## Fonctions
- Sauvegarde automatique locale, reprise, **import / export `.json`**
- Export **PDF** (impression), **Markdown**, copie texte
- **Lien de partage** (brief encodé dans l'adresse, rien n'est envoyé à un serveur, logo exclu)
- **Envoi vers Google Sheet** (une ligne par brief, mise à jour si renvoyé)
- Logo de la structure en en-tête et sur le PDF
- `?mode=pro` : affiche les points de vigilance (réservé à l'équipe)

## Mise en ligne (GitHub Pages)
1. Créer le dépôt, déposer ces fichiers à la racine.
2. *Settings → Pages → Deploy from a branch → `main` / root*.
3. Renseigner `config.js` (voir plus bas). Adresse de l'outil : `https://<compte>.github.io/<dépôt>/`.
4. Lien pour l'équipe : ajouter `?mode=pro`.

Dépôt public = questionnaire public. Ne mettez aucune donnée de brief dans le dépôt.

## Google Sheet
1. Créer un Google Sheet, puis *Extensions → Apps Script*.
2. Coller `apps-script/Code.gs`.
3. *Paramètres du projet → Propriétés du script* : ajouter `TOKEN` (chaîne aléatoire longue) et, si souhaité, `NOTIFY_EMAIL`.
4. Lancer la fonction `setup` une fois (autoriser l'accès).
5. *Déployer → Nouveau déploiement → Application Web* : exécuter en tant que **vous**, accès **Tout le monde**. Copier l'URL `/exec`.
6. Dans `config.js` : `endpoint` = cette URL, `token` = la même valeur que `TOKEN`.

Après chaque modification de `Code.gs`, créer un **nouveau déploiement** (ou une nouvelle version).

**À savoir** : le jeton figure dans la page, c'est un filtre anti-spam, pas un secret. Toute personne ayant l'URL peut *envoyer* un brief, mais seuls les propriétaires de la feuille peuvent les *lire*. Limitez le partage de la feuille. La colonne `statut` n'est jamais écrasée au renvoi : vous pouvez la modifier à la main.

## Logo
Déposer le fichier dans `assets/` et renseigner `logo` et `brandName` dans `config.js`.

## WordPress
Zipper le dossier (`brief-creatif.php`, `assets/`) et l'installer comme plugin.
`[brief_creatif endpoint="…/exec" token="…" logo="https://…/logo.svg" name="Ma structure"]`

## RGPD
Les briefs peuvent contenir des données personnelles. Informez les utilisateurs de la finalité et de la durée de conservation, et purgez la feuille régulièrement.

## Licence
À choisir (le plugin WordPress déclare GPL-2.0-or-later).
