# sonnuage-site

Page de présentation de [SonNuage](https://github.com/SonNuage/sonnuage), serveur de musique auto-hébergé.

Site statique sans étape de build : `public/index.html`, `public/styles.css`, `public/script.js` et le logo.
Polices Google Fonts, aucune autre dépendance. Les animations respectent `prefers-reduced-motion`.

## Aperçu local

```bash
python -m http.server 5090 -d public
```

Puis http://localhost:5090.

## Publication

- **GitHub Pages** : [.github/workflows/pages.yml](.github/workflows/pages.yml), à chaque push sur `main` (le dépôt
  est recopié depuis GitLab par le miroir). À faire une fois : *Settings → Pages → Source : GitHub Actions*.
- **GitLab Pages** : job `pages` de [.gitlab-ci.yml](.gitlab-ci.yml), si Pages est activé sur l'instance.

Le comparatif avec les autres serveurs se met à jour à la main dans `public/index.html` (section `#comparatif`).

## Licence

[GNU AGPL v3.0 ou ultérieure](LICENSE), comme le reste du projet.
