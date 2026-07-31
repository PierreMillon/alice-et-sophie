# Atelier Alice & Sophie

Site statique présentant les histoires, personnages et illustrations de l'atelier Alice & Sophie.

## Structure

- `index.html` — page principale
- `style.css` — styles
- `app.js` — chargement et affichage du contenu depuis `data.json`
- `data.json` — données du site (histoires, personnages, illustrations)

## Développement local

Ouvrir `index.html` via un petit serveur local (le `fetch` de `data.json` ne fonctionne pas en ouvrant le fichier directement) :

```bash
python3 -m http.server 8000
```

Puis visiter `http://localhost:8000`.

## Mettre à jour le contenu

Éditer `data.json` en ajoutant des entrées dans `stories`, `characters` ou `illustrations`.

## Publication (GitHub Pages)

Dans les paramètres du dépôt GitHub : **Settings > Pages**, choisir la branche `main` et le dossier `/ (root)`, puis enregistrer.

Site en ligne : https://pierremillon.github.io/alice-et-sophie/
