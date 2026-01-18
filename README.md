# Livre d'Or Massage

Application web minimaliste pour collecter les témoignages clients.

## Aperçu rapide

- **Livre d'or** : `index.html` - Affiche tous les témoignages
- **Formulaire** : `avis.html` - Permet aux clients de laisser un avis

## Setup (10 minutes)

### 1. Créer le Google Sheet

1. Aller sur [Google Sheets](https://sheets.google.com)
2. Créer un nouveau document
3. Renommer l'onglet en "Avis"
4. Ajouter les en-têtes en ligne 1 :
   ```
   Timestamp | Prénom | Massage | Date | Note | Commentaire
   ```

### 2. Ajouter le script

1. Dans le Google Sheet : **Extensions** > **Apps Script**
2. Supprimer le code par défaut
3. Copier-coller le contenu de `google-apps-script.js`
4. Sauvegarder (Ctrl+S)

### 3. Déployer l'API

1. Cliquer sur **Déployer** > **Nouveau déploiement**
2. Cliquer sur l'engrenage > **Application Web**
3. Configurer :
   - Description : "API Livre d'Or"
   - Exécuter en tant que : **Moi**
   - Accès : **Tout le monde**
4. Cliquer **Déployer**
5. Autoriser l'accès (cliquer sur les liens de permission)
6. **Copier l'URL** qui ressemble à :
   `https://script.google.com/macros/s/xxxxx/exec`

### 4. Configurer l'app

1. Ouvrir `config.js`
2. Coller l'URL dans `API_URL` :
   ```javascript
   API_URL: 'https://script.google.com/macros/s/xxxxx/exec',
   ```
3. Modifier `MASSAGE_TYPES` selon tes prestations

### 5. Héberger (optionnel mais recommandé)

**Option A - GitHub Pages (gratuit)**
1. Créer un repo GitHub
2. Pousser les fichiers
3. Settings > Pages > Deploy from main branch
4. URL : `https://tonpseudo.github.io/livre-or-massage/`

**Option B - Vercel (gratuit)**
1. Glisser le dossier sur vercel.com
2. URL automatique générée

**Option C - En local**
- Ouvrir `index.html` dans un navigateur (mode démo)

## Utilisation

1. Faire un massage
2. Envoyer le lien du formulaire au client : `tonsite.com/avis.html`
3. Le client remplit en 30 secondes
4. Le témoignage apparaît sur le livre d'or

## Personnalisation

### Modifier les types de massages

Dans `config.js` :
```javascript
MASSAGE_TYPES: [
    'Relaxant',
    'Tonique',
    'Spécial Dos',
    // Ajouter ici...
]
```

Puis mettre à jour le `<select>` dans `avis.html`.

### Modifier les couleurs

Dans `style.css`, modifier les variables CSS :
```css
:root {
    --accent: #9CAF88;      /* Couleur principale */
    --bg-primary: #FAF9F6;  /* Fond */
    --gold: #C9A959;        /* Étoiles */
}
```

## Structure

```
livre-or-massage/
├── index.html           # Page livre d'or
├── avis.html           # Formulaire
├── style.css           # Styles
├── config.js           # Configuration
├── script.js           # Logique affichage
├── form.js             # Logique formulaire
├── google-apps-script.js  # Code backend (à copier dans Google)
└── README.md
```
