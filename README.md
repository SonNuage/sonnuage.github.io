# sonnuage-site

Page de présentation de [SonNuage](https://github.com/SonNuage/sonnuage), serveur de musique auto-hébergé, en ligne sur https://sonnuage.github.io/.

Site statique sans étape de build : `public/index.html` (français), `public/en/index.html` (anglais),
`public/styles.css`, `public/script.js` et le logo. Le bouton FR/EN retient le choix ; sans choix, un navigateur
qui ne parle pas français est envoyé vers `/en/`. Polices Google Fonts, aucune autre dépendance. Les animations
respectent `prefers-reduced-motion`.

Les deux pages sont des traductions tenues à la main : toute modification se fait dans les deux, avec la même
structure. Chaque fait annoncé se vérifie dans le code ou dans `sonnuage/docs/ROADMAP.md`.

## Vérifications

```bash
node tests/check.mjs
```

Même structure en FR et en EN, ancres, hreflang, accessibilité (alt, titres, SVG, contraste AA), liste des dépôts et
fonctionnalités récentes. Lancé par la CI GitLab (job `check`) et avant chaque publication GitHub Pages.

## Aperçu local

```bash
python -m http.server 5090 -d public
```

Puis http://localhost:5090.

## Publication

- **GitHub Pages** : https://sonnuage.github.io/, publié par [.github/workflows/pages.yml](.github/workflows/pages.yml)
  à chaque push sur `main`. Le dépôt GitHub s'appelle `SonNuage/sonnuage.github.io` (site d'organisation, servi à la
  racine) et reçoit ce dépôt par le miroir GitLab. Source Pages : *GitHub Actions*.
- **GitLab Pages** : job `pages` de [.gitlab-ci.yml](.gitlab-ci.yml), si Pages est activé sur l'instance.

Le comparatif avec les autres serveurs se met à jour à la main dans les deux pages (sections `#comparatif` et
`#compare`).

## Licence

[GNU AGPL v3.0 ou ultérieure](LICENSE), comme le reste du projet.
