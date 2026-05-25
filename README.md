# form.track — Guide d'installation

## Structure des fichiers
```
formtrack/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── firebase-config.js   ← À configurer
│   └── app.js
└── README.md
```

---

## Étape 1 — Créer le projet Firebase

1. Va sur https://console.firebase.google.com
2. Clique **"Ajouter un projet"** → donne un nom (ex: `formtrack`)
3. Désactive Google Analytics (pas nécessaire) → **Créer le projet**

---

## Étape 2 — Activer Authentication Google

1. Dans ton projet Firebase → menu gauche **Authentication**
2. **"Commencer"** → onglet **"Sign-in method"**
3. Clique **Google** → Active → choisis un email de support → **Enregistrer**

---

## Étape 3 — Créer la base Firestore

1. Menu gauche → **Firestore Database**
2. **"Créer une base de données"** → Mode **Production** → Choisir la région (ex: `europe-west3`) → **Activer**
3. Onglet **Règles** → remplace le contenu par :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
4. **Publier**

---

## Étape 4 — Récupérer la config Firebase

1. Menu gauche → ⚙️ **Paramètres du projet** → onglet **"Général"**
2. Descends jusqu'à **"Vos applications"** → clique **"</>** Web"
3. Donne un nom → **Enregistrer l'application**
4. Copie l'objet `firebaseConfig` affiché

Ouvre `js/firebase-config.js` et remplace les valeurs :
```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "formtrack-xxxx.firebaseapp.com",
  projectId:         "formtrack-xxxx",
  storageBucket:     "formtrack-xxxx.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123"
};
```

---

## Étape 5 — Autoriser le domaine GitLab Pages

1. Firebase → **Authentication** → onglet **"Paramètres"** → **"Domaines autorisés"**
2. Ajoute : `TON_USERNAME.gitlab.io`

---

## Étape 6 — Importer les données existantes (Thomas & Anna)

Les données historiques sont dans `js/app.js` dans la constante `INITIAL_DATA`.
Elles sont importées **automatiquement** au premier login de chaque personne.

**Pour que ça marche**, tu dois renseigner les vrais UIDs Google :

1. Déploie l'app sur GitLab Pages (voir Étape 7)
2. **Thomas** se connecte → ouvre la console navigateur (F12) → onglet **Console**
3. Tape : `firebase.auth().currentUser.uid` — ou va dans Firebase Console → **Authentication** → **Utilisateurs** → copie l'UID de Thomas
4. Dans `js/app.js`, remplace `"THOMAS_UID"` par l'UID réel (ex: `"abc123xyz..."`)
5. Fais pareil pour **Anna** avec `"ANNA_UID"`
6. Redéploie → au prochain login, les données sont importées automatiquement

> ⚠️ L'import ne se fait qu'une seule fois (si le compte n'existe pas encore en base).
> Si tu veux réimporter, supprime le document utilisateur dans Firestore Console.

---

## Étape 7 — Déployer sur GitLab Pages

### Option A — Sans CI/CD (simple)

1. Crée un repo GitLab public/privé nommé `formtrack` (ou autre)
2. Push tous les fichiers à la racine du repo
3. Va dans **Settings → Pages** → assure-toi que Pages est activé
4. L'URL sera : `https://TON_USERNAME.gitlab.io/formtrack/`

### Option B — Avec `.gitlab-ci.yml` (recommandé)

Crée un fichier `.gitlab-ci.yml` à la racine :

```yaml
pages:
  stage: deploy
  script:
    - mkdir -p public
    - cp -r . public/
    - rm -f public/.gitlab-ci.yml public/README.md
  artifacts:
    paths:
      - public
  only:
    - main
```

Push → GitLab Pages déploie automatiquement à chaque commit.

---

## Utilisation au quotidien

- **Chaque personne** ouvre l'app et se connecte avec son compte Google
- Elle voit **uniquement ses propres données** (isolation complète par Firebase rules)
- **Modifier l'objectif** : cliquer sur le chiffre dans la carte "Objectif"
- **Ajouter une pesée** : bouton en bas de l'onglet Poids
- **Ajouter des mensurations** : bouton en bas de l'onglet Mensurations — les valeurs de la dernière prise sont pré-remplies pour gagner du temps

---

## Sécurité

Les règles Firestore garantissent qu'un utilisateur ne peut **jamais** lire ou écrire les données d'un autre.
Thomas ne voit pas les données d'Anna, et inversement.
