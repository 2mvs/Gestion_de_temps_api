# 🚀 Système GTA - Gestion des Temps et Activités

Application complète de gestion des temps avec **Backend Express + TypeScript** et **Frontend Next.js**.

---

## ⚡ Démarrage Rapide (5 minutes)

### 1. Configuration MySQL
```bash
# Créer la base de données
mysql -u root -p
CREATE DATABASE gta_db;
EXIT;
```

### 2. Backend
```bash
cd backend

# Installer
npm install

# Créer le fichier .env (choisissez votre config)
# Pour XAMPP/WAMP : DATABASE_URL="mysql://root:@localhost:3306/gta_db"
# Pour MySQL : DATABASE_URL="mysql://root:password@localhost:3306/gta_db"

# Initialiser
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Démarrer
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Connexion
- **URL** : http://localhost:3000/login
- **Email** : admin@gta.com
- **Password** : admin123

---

## 📋 Ce Qui A Été Créé

### ✅ Backend Complet
- **70+ endpoints API REST**
- **16 modèles de données** (Prisma)
- **Authentification JWT** sécurisée
- **Import CSV** (jusqu'à 50MB)
- **Système d'audit** complet
- **Rapports et statistiques**

### ✅ Frontend Moderne
- **13 pages** fonctionnelles
- **9 composants réutilisables**
- **SelectSearch** avec recherche intelligente
- **Modales uniformisées**
- **Design cohérent** (Tailwind)

### ✅ Fonctionnalités
- Gestion employés (CRUD + CSV)
- Pointages (validation automatique)
- Absences (workflow d'approbation)
- Heures supplémentaires
- Heures spéciales
- Cycles de travail avancés
- Structure organisationnelle
- Notifications
- Dashboard avec statistiques

---

## 📚 Documentation

### 🌟 **COMMENCEZ ICI**
→ **`DEMARRAGE_RAPIDE.md`** - Guide de démarrage

### Configuration
→ `SETUP_MYSQL.txt` - Configuration MySQL rapide  
→ `backend/SETUP_MYSQL.md` - Guide MySQL complet  
→ `backend/CONTENU_FICHIER_ENV.txt` - Fichier .env à copier  

### Développement
→ `backend/README.md` - Documentation backend  
→ `backend/INDEX.md` - Navigation dans toute la doc  
→ `GUIDE_TEST.md` - Tests de validation  

### Rapports
→ `SESSION_COMPLETE_RECAP.md` - Récap complet de tout  
→ `RAPPORT_CORRECTIONS.md` - Toutes les corrections  
→ `REFONTE_SYSTEME_HORAIRES.md` - Nouveau système  

---

## 🎯 Fonctionnalités Principales

### 🔐 Authentification
- Inscription et connexion
- JWT avec rôles (ADMIN, MANAGER, USER)
- Protection des routes

### 👥 Gestion Employés
- CRUD complet
- Import CSV (test : `test-import-employees.csv`)
- Recherche intelligente (SelectSearch)
- Affectation unités et cycles

### ⏰ Pointages
- Clock-in / Clock-out
- **Validation** : Impossible de pointer au futur
- Calcul automatique des heures
- Validation avec règles métier

### 📅 Absences
- 7 types d'absences
- Workflow d'approbation
- Historique complet

### 🌟 Heures Spéciales & Supplémentaires
- Déclaration facilitée
- Types multiples (nuit, férié, week-end)
- Approbation workflow

### 📊 Cycles et Horaires
- Cycles personnalisables
- **Nouveau** : Périodes et plages horaires
- **Nouveau** : Multiplicateurs automatiques
- Affectation multiple horaires par cycle

### 🏢 Structure Organisationnelle
- Hiérarchie illimitée
- Arbre organisationnel
- Affectation employés

---

## 🎨 Améliorations UX

### SelectSearch
- 🔍 Recherche instantanée
- 👤 Avatar avec initiales
- 📋 Numéro + unité affichés
- ⚡ Performance optimale

### Modales Uniformisées
- Design cohérent partout
- Animations fluides
- Headers informatifs
- Boutons standardisés

### Dashboard
- Statistiques en temps réel
- Alertes intelligentes
- Top 5 employés
- Graphiques visuels

---

## 🗄️ Architecture

### Backend
```
backend/
├── src/
│   ├── controllers/    # Logique métier
│   ├── routes/         # Définition routes
│   ├── middlewares/    # Auth, validation, errors
│   ├── utils/          # JWT, audit
│   └── config/         # Database
├── prisma/
│   └── schema.prisma   # 16 modèles
└── [Documentation]
```

### Frontend
```
frontend/
├── app/                # Pages Next.js
├── components/
│   └── ui/            # 9 composants réutilisables
└── lib/
    ├── api.ts         # Client API
    ├── auth.ts        # Gestion auth
    └── constants.ts   # Enums centralisés
```

---

## 🐛 Support

### Problèmes Courants
- **Erreur MySQL** → Consultez `SETUP_MYSQL.txt`
- **Erreur .env** → Consultez `backend/CONTENU_FICHIER_ENV.txt`
- **Erreur import CSV** → Consultez `GUIDE_IMPORT_CSV.md`
- **Dashboard vide** → Vérifiez que le seed a tourné

### Commandes Utiles
```bash
# Backend
cd backend
npm run dev              # Développement
npm run prisma:studio    # Interface DB
npm run prisma:seed      # Réinsérer données

# Frontend
cd frontend
npm run dev              # Développement
```

---

## ✅ Checklist de Vérification

- [ ] MySQL installé et démarré
- [ ] Base `gta_db` créée
- [ ] Backend : `npm install` exécuté
- [ ] Backend : `.env` créé
- [ ] Backend : `npm run prisma:migrate` réussi
- [ ] Backend : `npm run prisma:seed` réussi
- [ ] Backend : Serveur sur http://localhost:8008
- [ ] Frontend : `npm install` exécuté
- [ ] Frontend : Serveur sur http://localhost:3000
- [ ] Login fonctionne avec admin@gta.com
- [ ] Dashboard affiche les statistiques
- [ ] Import CSV fonctionne

---

## 🎉 Le Projet Est Prêt !

Votre système GTA complet est opérationnel avec :
- ✅ Backend professionnel
- ✅ Frontend moderne
- ✅ 70+ endpoints API
- ✅ Recherche intelligente
- ✅ Modales uniformisées
- ✅ Dashboard fonctionnel
- ✅ Documentation complète

**Bon développement ! 🚀**

---

📅 Créé le : 2 novembre 2025  
📦 Version : 3.0.0  
👨‍💻 Technologies : Express, TypeScript, Prisma, MySQL, Next.js, React  
📚 Documentation : 20+ guides disponibles

