# Backend GTA - Système de Gestion des Temps et Activités

API REST complète développée avec **Express**, **TypeScript** et **Prisma ORM** pour la gestion des temps et activités des employés.

## 🚀 Fonctionnalités

### Authentification
- ✅ Inscription et connexion avec JWT
- ✅ Gestion des rôles (ADMIN, MANAGER, USER)
- ✅ Protection des routes par authentification

### Gestion des Employés
- ✅ CRUD complet des employés
- ✅ Import en masse via CSV
- ✅ Gestion des statuts (Actif, Inactif, Suspendu, Terminé)
- ✅ Types de contrat (Temps plein, Temps partiel, Intérim, Contrat)

### Cycles de Travail et Horaires
- ✅ Définition des cycles de travail (Hebdomadaire, Bihebdomadaire, Mensuel, Personnalisé)
- ✅ Configuration des horaires de travail
- ✅ Gestion des seuils d'heures supplémentaires

### Pointages (Time Entries)
- ✅ Pointage d'entrée et de sortie
- ✅ Calcul automatique des heures travaillées
- ✅ Validation des pointages avec règles métier
- ✅ Calcul des balances de temps par période
- ✅ Statistiques de validation

### Absences
- ✅ Demandes d'absences (Congés, Maladie, Personnel, etc.)
- ✅ Workflow d'approbation
- ✅ Historique des absences par employé

### Heures Supplémentaires et Heures Spéciales
- ✅ Déclaration des heures supplémentaires
- ✅ Heures spéciales (Jours fériés, Nuit, Week-end, Astreinte)
- ✅ Workflow d'approbation

### Structure Organisationnelle
- ✅ Gestion hiérarchique des unités organisationnelles
- ✅ Arbre organisationnel
- ✅ Affectation des employés aux unités

### Notifications
- ✅ Notifications en temps réel
- ✅ Marquage comme lu/non lu
- ✅ Alertes système

### Audit et Traçabilité
- ✅ Logs d'audit pour toutes les opérations
- ✅ Historique des modifications
- ✅ Traçabilité complète

### Rapports
- ✅ Rapport général
- ✅ Rapport par employé
- ✅ Rapport mensuel
- ✅ Rapport de présence
- ✅ Résumé des heures supplémentaires

## 📋 Prérequis

- **Node.js** >= 18.x
- **MySQL** >= 8.0 (ou XAMPP/WAMP)
- **npm** ou **yarn**

## 🛠️ Installation

### 1. Cloner le projet

```bash
cd backend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du dossier `backend` :

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/gta_db?schema=public"

# JWT Secret
JWT_SECRET="votre_secret_jwt_très_sécurisé_changez_moi"
JWT_EXPIRES_IN="7d"

# Configuration serveur
PORT=8008
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:3000"
```

### 4. Configurer la base de données

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer la base de données et exécuter les migrations
npm run prisma:migrate

# (Optionnel) Insérer des données de test
npm run prisma:seed
```

### 5. Démarrer le serveur

**Mode développement (avec hot-reload) :**
```bash
npm run dev
```

**Mode production :**
```bash
npm run build
npm start
```

Le serveur sera disponible sur `http://localhost:8008`

## 📁 Structure du projet

```
backend/
├── prisma/
│   ├── schema.prisma      # Schéma de base de données
│   └── seed.ts            # Données de test
├── src/
│   ├── config/
│   │   └── database.ts    # Configuration Prisma
│   ├── controllers/       # Contrôleurs (logique métier)
│   │   ├── auth.controller.ts
│   │   ├── employee.controller.ts
│   │   ├── workCycle.controller.ts
│   │   ├── schedule.controller.ts
│   │   ├── timeEntry.controller.ts
│   │   ├── absence.controller.ts
│   │   ├── overtime.controller.ts
│   │   ├── specialHour.controller.ts
│   │   ├── organizationalUnit.controller.ts
│   │   ├── notification.controller.ts
│   │   ├── auditLog.controller.ts
│   │   └── report.controller.ts
│   ├── middlewares/       # Middlewares
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── routes/            # Définition des routes
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── employee.routes.ts
│   │   └── ...
│   ├── utils/             # Utilitaires
│   │   ├── jwt.ts
│   │   └── audit.ts
│   ├── app.ts             # Configuration Express
│   └── server.ts          # Point d'entrée
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil utilisateur (authentifié)

### Employés
- `GET /api/employees` - Liste des employés
- `GET /api/employees/:id` - Détails d'un employé
- `POST /api/employees` - Créer un employé
- `PUT /api/employees/:id` - Modifier un employé
- `DELETE /api/employees/:id` - Supprimer un employé (soft delete)
- `POST /api/employees/bulk` - Import en masse

### Cycles de Travail
- `GET /api/work-cycles` - Liste des cycles
- `GET /api/work-cycles/:id` - Détails d'un cycle
- `POST /api/work-cycles` - Créer un cycle
- `PUT /api/work-cycles/:id` - Modifier un cycle
- `DELETE /api/work-cycles/:id` - Supprimer un cycle

### Horaires
- `GET /api/schedules` - Liste des horaires
- `GET /api/schedules/employee/:employeeId` - Horaires d'un employé
- `POST /api/schedules` - Créer un horaire
- `PUT /api/schedules/:id` - Modifier un horaire
- `DELETE /api/schedules/:id` - Supprimer un horaire

### Pointages
- `GET /api/time-entries/employee/:employeeId` - Pointages d'un employé
- `POST /api/time-entries/:employeeId/clock-in` - Pointage d'entrée
- `POST /api/time-entries/:employeeId/clock-out` - Pointage de sortie
- `GET /api/time-entries/employee/:employeeId/balance` - Balance de temps
- `POST /api/time-entries/:id/validate` - Valider un pointage
- `POST /api/time-entries/employee/:employeeId/validate-period` - Valider une période
- `GET /api/time-entries/employee/:employeeId/validation-stats` - Statistiques de validation
- `GET /api/time-entries/validation-rules` - Règles de validation

### Absences
- `GET /api/absences` - Liste des absences
- `GET /api/absences/employee/:employeeId` - Absences d'un employé
- `POST /api/absences` - Créer une absence
- `PATCH /api/absences/:id/approve` - Approuver/Rejeter une absence

### Heures Supplémentaires
- `GET /api/overtimes/employee/:employeeId` - Heures sup d'un employé
- `POST /api/overtimes` - Créer des heures sup
- `PATCH /api/overtimes/:id/approve` - Approuver/Rejeter

### Heures Spéciales
- `GET /api/special-hours/employee/:employeeId` - Heures spéciales d'un employé
- `POST /api/special-hours` - Créer des heures spéciales
- `PATCH /api/special-hours/:id/approve` - Approuver/Rejeter

### Unités Organisationnelles
- `GET /api/organizational-units` - Liste des unités
- `GET /api/organizational-units/tree` - Arbre hiérarchique
- `GET /api/organizational-units/roots` - Unités racines
- `GET /api/organizational-units/:id` - Détails d'une unité
- `GET /api/organizational-units/:id/children` - Sous-unités
- `POST /api/organizational-units` - Créer une unité
- `PUT /api/organizational-units/:id` - Modifier une unité
- `DELETE /api/organizational-units/:id` - Supprimer une unité

### Notifications
- `GET /api/notifications` - Liste des notifications
- `GET /api/notifications/unread-count` - Nombre de non lues
- `PATCH /api/notifications/:id/read` - Marquer comme lue
- `PATCH /api/notifications/mark-all-read` - Tout marquer comme lu
- `DELETE /api/notifications/:id` - Supprimer une notification
- `POST /api/notifications/test` - Envoyer une notification de test
- `POST /api/notifications/system-alert` - Alerte système (ADMIN)

### Logs d'Audit
- `GET /api/audit-logs` - Liste des logs
- `GET /api/audit-logs/model/:modelType/:modelId` - Logs d'un modèle
- `GET /api/audit-logs/user/:userId` - Logs d'un utilisateur

### Rapports
- `GET /api/reports/general` - Rapport général
- `GET /api/reports/employees` - Rapport employés
- `GET /api/reports/monthly` - Rapport mensuel
- `GET /api/reports/attendance` - Rapport de présence
- `GET /api/reports/overtime-summary` - Résumé heures sup
- `GET /api/reports/export/:type` - Exporter un rapport

### Autres
- `GET /api/health` - Health check
- `GET /` - Documentation API

## 🔐 Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification.

Pour accéder aux routes protégées, incluez le token dans le header :

```
Authorization: Bearer <votre_token_jwt>
```

## 🧪 Données de test

Après avoir exécuté `npm run prisma:seed`, vous aurez accès à :

**Utilisateur admin :**
- Email : `admin@gta.com`
- Mot de passe : `admin123`
- Rôle : ADMIN

**Employés de test :**
- EMP001 - Jean Dupont (DSI)
- EMP002 - Marie Martin (DRH)
- EMP003 - Pierre Bernard (DSI)

## 🛡️ Sécurité

- ✅ Mots de passe hashés avec bcrypt
- ✅ JWT avec expiration
- ✅ Validation des données entrantes
- ✅ Protection CORS
- ✅ Soft delete pour la préservation des données
- ✅ Logs d'audit complets

## 📊 Base de données

Le projet utilise **PostgreSQL** avec **Prisma ORM**.

**Commandes utiles Prisma :**

```bash
# Créer une nouvelle migration
npx prisma migrate dev --name nom_migration

# Appliquer les migrations
npx prisma migrate deploy

# Ouvrir Prisma Studio (interface graphique)
npm run prisma:studio

# Régénérer le client Prisma
npm run prisma:generate

# Réinitialiser la base de données
npx prisma migrate reset
```

## 🤝 Contribution

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📝 Licence

MIT

## 👥 Auteurs

Projet réalisé pour le système GTA - Gestion des Temps et Activités

## 🆘 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Contactez l'équipe de développement

