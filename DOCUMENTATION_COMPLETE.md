# Documentation Complète du Projet GTA
## Système de Gestion des Temps et Activités

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture Technique](#architecture-technique)
3. [Technologies Utilisées](#technologies-utilisées)
4. [Structure du Projet](#structure-du-projet)
5. [Modèle de Données](#modèle-de-données)
6. [Diagrammes UML](#diagrammes-uml)
7. [Cas d'Utilisation](#cas-dutilisation)
8. [API Endpoints](#api-endpoints)
9. [Fonctionnalités Principales](#fonctionnalités-principales)
10. [Flux de Données](#flux-de-données)
11. [Configuration et Déploiement](#configuration-et-déploiement)

---

## 🎯 Vue d'Ensemble

### Description du Projet

Le **Système de Gestion des Temps et Activités (GTA)** est une application web complète permettant de gérer :
- Les employés et leur organisation
- Les cycles de travail et horaires personnalisés
- Les pointages en temps réel
- Les absences et congés
- Les heures supplémentaires et heures spéciales
- Le calcul automatique des heures sup/spéciales basé sur les horaires
- Les validations et approbations
- Les rapports et statistiques

### Objectifs

- **Automatisation** : Calcul automatique des heures supplémentaires et spéciales
- **Flexibilité** : Gestion de cycles de travail variés (hebdomadaires, bihebdomadaires, mensuels)
- **Précision** : Pointage horaire précis avec validation
- **Traçabilité** : Audit complet des actions utilisateurs
- **Expérience utilisateur** : Interface moderne et intuitive

---

## 🏗️ Architecture Technique

### Architecture Générale

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT WEB                          │
│                    (Next.js 16 - React 19)                  │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Pages    │  │Components│  │  Utils   │  │   API    │  │
│  │          │  │    UI    │  │          │  │ Client   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/HTTPS (REST API)
                           │ JWT Authentication
┌──────────────────────────┴──────────────────────────────────┐
│                    SERVEUR BACKEND                          │
│              (Express.js - TypeScript)                      │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Routes   │  │Controllers│ │ Middleware│  │  Utils   │  │
│  │          │  │           │ │          │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ Prisma ORM
┌──────────────────────────┴──────────────────────────────────┐
│                     BASE DE DONNÉES                         │
│                    MySQL 8.0+                              │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Tables   │  │ Relations│  │  Indexes │  │  Seeds   │  │
│  │          │  │          │  │          │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Pattern Architectural

Le projet suit une architecture **MVC (Model-View-Controller)** modifiée :

- **Model** : Prisma Schema (ORM) + Types TypeScript
- **View** : Pages Next.js (React Components)
- **Controller** : Contrôleurs Express.js

### Flux de Communication

```
1. Client → Requête HTTP (avec JWT token)
2. Middleware → Vérification authentification/autorisation
3. Controller → Traitement métier
4. Prisma Client → Requête SQL vers MySQL
5. MySQL → Résultat
6. Controller → Formatage réponse JSON
7. Middleware → Gestion erreurs
8. Client → Réception et affichage
```

---

## 🛠️ Technologies Utilisées

### Backend

| Technologie | Version | Usage |
|------------|---------|-------|
| **Node.js** | 22.x+ | Runtime JavaScript |
| **Express.js** | 4.21.1 | Framework web |
| **TypeScript** | 5.6.3 | Typage statique |
| **Prisma** | 5.22.0 | ORM pour MySQL |
| **MySQL** | 8.0+ | Base de données relationnelle |
| **JWT** | 9.0.2 | Authentification par tokens |
| **bcryptjs** | 2.4.3 | Hashage des mots de passe |
| **express-validator** | 7.2.0 | Validation des données |
| **cors** | 2.8.5 | Gestion CORS |
| **morgan** | 1.10.0 | Logging HTTP |
| **dotenv** | 16.4.5 | Variables d'environnement |

### Frontend

| Technologie | Version | Usage |
|------------|---------|-------|
| **Next.js** | 16.0.1 | Framework React |
| **React** | 19.2.0 | Bibliothèque UI |
| **TypeScript** | 5.x | Typage statique |
| **Tailwind CSS** | 4.x | Framework CSS |
| **Axios** | 1.13.1 | Client HTTP |
| **React Query** | 5.90.5 | Gestion état serveur |
| **Lucide React** | 0.548.0 | Icônes |
| **React Toastify** | 11.0.5 | Notifications |
| **Radix UI** | 1.2.3 | Composants UI accessibles |

### Outils de Développement

- **tsx** : Exécution TypeScript sans compilation
- **ESLint** : Linter JavaScript/TypeScript
- **PostCSS** : Traitement CSS

---

## 📁 Structure du Projet

```
my_project/
│
├── backend/                    # Application backend
│   ├── prisma/
│   │   ├── schema.prisma       # Schéma base de données
│   │   ├── migrations/          # Migrations Prisma
│   │   └── seed.ts             # Données de test
│   │
│   ├── src/
│   │   ├── app.ts              # Configuration Express
│   │   ├── server.ts           # Point d'entrée serveur
│   │   │
│   │   ├── config/
│   │   │   └── database.ts     # Configuration Prisma
│   │   │
│   │   ├── controllers/        # Contrôleurs métier
│   │   │   ├── auth.controller.ts
│   │   │   ├── employee.controller.ts
│   │   │   ├── timeEntry.controller.ts
│   │   │   ├── schedule.controller.ts
│   │   │   ├── workCycle.controller.ts
│   │   │   ├── absence.controller.ts
│   │   │   ├── overtime.controller.ts
│   │   │   ├── specialHour.controller.ts
│   │   │   ├── organizationalUnit.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── auditLog.controller.ts
│   │   │   ├── report.controller.ts
│   │   │   ├── period.controller.ts
│   │   │   └── timeRange.controller.ts
│   │   │
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts    # Authentification JWT
│   │   │   ├── error.middleware.ts   # Gestion erreurs
│   │   │   └── validation.middleware.ts  # Validation données
│   │   │
│   │   ├── routes/             # Routes API
│   │   │   ├── index.ts        # Router principal
│   │   │   ├── auth.routes.ts
│   │   │   ├── employee.routes.ts
│   │   │   └── ...
│   │   │
│   │   └── utils/
│   │       ├── jwt.ts          # Utilitaires JWT
│   │       ├── audit.ts        # Logs d'audit
│   │       └── overtimeCalculator.ts  # Calcul heures sup/spéciales
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # Application frontend
│   ├── app/                    # Pages Next.js (App Router)
│   │   ├── layout.tsx          # Layout principal
│   │   ├── page.tsx            # Page d'accueil
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── employees/
│   │   ├── time-entries/
│   │   ├── schedules/
│   │   ├── work-cycles/
│   │   ├── absences/
│   │   ├── overtimes/
│   │   ├── special-hours/
│   │   ├── organizational-units/
│   │   ├── validation/
│   │   └── notifications/
│   │
│   ├── components/
│   │   ├── Layout.tsx          # Layout avec sidebar
│   │   └── ui/                 # Composants UI réutilisables
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── SelectSearch.tsx
│   │       ├── Modal.tsx
│   │       ├── Badge.tsx
│   │       ├── PageHeader.tsx
│   │       ├── FormActions.tsx
│   │       └── StatsCard.tsx
│   │
│   ├── lib/
│   │   ├── api.ts             # Client API Axios
│   │   ├── auth.ts            # Utilitaires authentification
│   │   ├── constants.ts       # Constantes et enums
│   │   └── utils.ts           # Utilitaires généraux
│   │
│   ├── public/                # Assets statiques
│   ├── package.json
│   └── tsconfig.json
│
└── Documentation/
    ├── DOCUMENTATION_COMPLETE.md  # Ce fichier
    ├── DEMARRAGE_RAPIDE.md
    ├── GUIDE_IMPORT_CSV.md
    └── ...
```

---

## 💾 Modèle de Données

### Diagramme Entité-Relation (ER)

```
┌──────────────┐
│     User     │
├──────────────┤
│ id (PK)      │
│ email (UK)   │
│ password     │
│ role         │
└──────┬───────┘
       │ 1:1
       │
       ▼
┌──────────────┐      ┌──────────────┐
│   Employee   │      │Organizational│
├──────────────┤      │    Unit      │
│ id (PK)      │◄─────┤              │
│ employeeNum  │ N:1  │ id (PK)      │
│ firstName    │      │ code (UK)    │
│ lastName     │      │ name         │
│ gender       │      │ parentId (FK)│
│ contractType │      └──────────────┘
│ status       │
│ userId (FK)  │      ┌──────────────┐
│ orgUnitId(FK)│      │  WorkCycle   │
│ workCycleId  │◄─────┤              │
└──────┬───────┘ N:1  │ id (PK)      │
       │             │ name          │
       │             │ cycleType     │
       │ 1:N         │ weeklyHours   │
       ▼             └──────┬─────────┘
┌──────────────┐          │
│  TimeEntry   │          │ N:M
├──────────────┤          │
│ id (PK)      │          ▼
│ employeeId   │   ┌──────────────┐
│ date         │   │WorkCycleSched│
│ clockIn      │   ├──────────────┤
│ clockOut     │   │ id (PK)      │
│ totalHours   │   │ workCycleId  │
│ status       │   │ scheduleId   │
│ isValidated  │   │ dayOfWeek    │
└──────────────┘   └──────┬───────┘
                         │
                         │ 1:N
                         ▼
                  ┌──────────────┐
                  │   Schedule   │
                  ├──────────────┤
                  │ id (PK)      │
                  │ label        │
                  │ scheduleType │
                  │ startTime    │
                  │ endTime      │
                  └──────┬───────┘
                         │ 1:N
                         ▼
                  ┌──────────────┐
                  │    Period    │
                  ├──────────────┤
                  │ id (PK)      │
                  │ scheduleId   │
                  │ name         │
                  │ startTime    │
                  │ endTime      │
                  │ periodType   │
                  └──────┬───────┘
                         │ 1:N
                         ▼
                  ┌──────────────┐
                  │  TimeRange   │
                  ├──────────────┤
                  │ id (PK)      │
                  │ periodId     │
                  │ name         │
                  │ startTime    │
                  │ endTime      │
                  │ rangeType    │
                  │ multiplier   │
                  └──────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Absence    │      │  Overtime    │      │SpecialHour   │
├──────────────┤      ├──────────────┤      ├──────────────┤
│ id (PK)      │      │ id (PK)      │      │ id (PK)      │
│ employeeId   │      │ employeeId   │      │ employeeId   │
│ absenceType  │      │ date         │      │ date         │
│ startDate    │      │ hours        │      │ hours        │
│ endDate      │      │ reason       │      │ hourType     │
│ days         │      │ status       │      │ status       │
│ status       │      └──────────────┘      └──────────────┘
│ approvedBy   │
└──────────────┘

┌──────────────┐      ┌──────────────┐
│ Notification │      │  AuditLog   │
├──────────────┤      ├──────────────┤
│ id (PK)      │      │ id (PK)      │
│ userId       │      │ userId       │
│ type         │      │ action       │
│ title        │      │ modelType    │
│ message      │      │ modelId      │
│ isRead       │      │ oldValue     │
└──────────────┘      │ newValue     │
                      └──────────────┘
```

### Description des Modèles

#### 1. **User** (Utilisateur)
- Gère les comptes utilisateurs du système
- Rôles : ADMIN, MANAGER, USER
- Relation 1:1 avec Employee (un utilisateur peut être un employé)

#### 2. **Employee** (Employé)
- Informations des employés
- Statuts : ACTIVE, INACTIVE, SUSPENDED, TERMINATED
- Types de contrat : FULL_TIME, PART_TIME, INTERIM, CONTRACT
- Lié à un OrganizationalUnit et un WorkCycle

#### 3. **OrganizationalUnit** (Unité Organisationnelle)
- Structure hiérarchique (parent/enfants)
- Code unique, nom, description
- Peut contenir plusieurs employés

#### 4. **WorkCycle** (Cycle de Travail)
- Types : WEEKLY, BIWEEKLY, MONTHLY, CUSTOM
- Définit les heures hebdomadaires et le seuil d'heures sup
- Relation N:M avec Schedule via WorkCycleSchedule

#### 5. **Schedule** (Horaire)
- Types : STANDARD, NIGHT_SHIFT, FLEXIBLE, CUSTOM
- Peut avoir des périodes (Period) et plages horaires (TimeRange)
- Format temps : String "HH:MM"

#### 6. **Period** (Période)
- Périodes dans un horaire (ex: "Matin", "Après-midi", "Nuit")
- Types : REGULAR, BREAK, OVERTIME, SPECIAL
- Contient des TimeRange

#### 7. **TimeRange** (Plage Horaire)
- Plages spécifiques dans une période
- Types : NORMAL, OVERTIME, NIGHT_SHIFT, SUNDAY, HOLIDAY, SPECIAL
- Multiplicateur pour calcul (ex: 1.25 = 25% sup)

#### 8. **TimeEntry** (Pointage)
- Pointages entrée/sortie des employés
- Statuts : PENDING, COMPLETED, INCOMPLETE, ABSENT
- Validation automatique des heures

#### 9. **Absence** (Absence)
- Types : VACATION, SICK_LEAVE, PERSONAL, MATERNITY, PATERNITY, UNPAID_LEAVE, OTHER
- Statuts : PENDING, APPROVED, REJECTED
- Nécessite approbation

#### 10. **Overtime** (Heures Supplémentaires)
- Création automatique ou manuelle
- Nécessite approbation

#### 11. **SpecialHour** (Heures Spéciales)
- Types : HOLIDAY, NIGHT_SHIFT, WEEKEND, ON_CALL
- Création automatique ou manuelle

#### 12. **Notification** (Notification)
- Types : INFO, WARNING, ERROR, SUCCESS, APPROVAL_REQUEST, SYSTEM_ALERT
- Suivi lecture

#### 13. **AuditLog** (Journal d'Audit)
- Enregistre toutes les actions utilisateurs
- Stocke anciennes/nouvelles valeurs (JSON)

---

## 📊 Diagrammes UML

### Diagramme de Classes (Backend Controllers)

```
┌─────────────────────────────────────────┐
│         BaseController (abstract)       │
├─────────────────────────────────────────┤
│ + handleError()                         │
│ + sendResponse()                        │
└─────────────────────────────────────────┘
              ▲
              │
     ┌────────┴────────┐
     │                 │
┌──────────────┐  ┌──────────────┐
│AuthController│  │EmployeeCtrlr │
├──────────────┤  ├──────────────┤
│+ login()     │  │+ getAll()    │
│+ register()  │  │+ create()    │
│+ me()        │  │+ update()    │
│              │  │+ delete()    │
│              │  │+ importCSV() │
└──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐
│TimeEntryCtrlr│  │ScheduleCtrlr │
├──────────────┤  ├──────────────┤
│+ clockIn()   │  │+ getAll()    │
│+ clockOut()  │  │+ create()    │
│+ getByDate() │  │+ update()    │
│              │  │+ getPeriods() │
└──────────────┘  └──────────────┘

┌──────────────┐  ┌──────────────┐
│WorkCycleCtrlr│  │OvertimeCalc  │
├──────────────┤  ├──────────────┤
│+ getAll()    │  │+ calculate() │
│+ create()    │  │+ autoCreate() │
│+ assignSchdl │  │              │
└──────────────┘  └──────────────┘
```

### Diagramme de Séquence - Pointage et Calcul Automatique

```
Employé    Frontend    Backend    TimeEntry    OvertimeCalc    Database
  │           │           │           │             │              │
  │──ClockIn──>│           │           │             │              │
  │           │──POST─────>│           │             │              │
  │           │           │──Create───>             │              │
  │           │           │           │──Save───────>              │
  │           │<──Response│<──────────│<──Success────              │
  │<──OK──────│           │           │             │              │
  │           │           │           │             │              │
  │──ClockOut─>│           │           │             │              │
  │           │──POST─────>│           │             │              │
  │           │           │──Update───>             │              │
  │           │           │           │──Save───────>              │
  │           │           │──calcHours()────────────>│              │
  │           │           │           │             │──GetEmployee─>
  │           │           │           │             │──GetSchedule─>
  │           │           │           │             │<──Data────────
  │           │           │           │             │──Calculate───>
  │           │           │           │             │──CreateOVT───>
  │           │           │           │             │──CreateSPC───>
  │           │<──Response│<──────────│<────────────│<──Success────
  │<──OK──────│           │           │             │              │
```

### Diagramme de Cas d'Utilisation

```
┌─────────────────────────────────────────────────────────────┐
│                      ACTEURS                                │
├─────────────────────────────────────────────────────────────┤
│ • Admin         : Administrateur système                    │
│ • Manager       : Gestionnaire/RH                           │
│ • Employee      : Employé standard                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   CAS D'UTILISATION                         │
└─────────────────────────────────────────────────────────────┘

                          Admin
                            │
                            ├─► Gérer les employés (CRUD)
                            ├─► Gérer les unités organisationnelles
                            ├─► Configurer les cycles de travail
                            ├─► Configurer les horaires
                            ├─► Valider les pointages
                            ├─► Approuver/rejeter absences
                            ├─► Approuver/rejeter heures sup
                            ├─► Consulter les logs d'audit
                            └─► Générer des rapports

                          Manager
                            │
                            ├─► Gérer les employés (lecture/update)
                            ├─► Valider les pointages
                            ├─► Approuver/rejeter absences
                            ├─► Approuver/rejeter heures sup
                            ├─► Consulter les statistiques
                            └─► Générer des rapports

                          Employee
                            │
                            ├─► Se connecter/déconnecter
                            ├─► Pointer (entrée/sortie)
                            ├─► Consulter ses pointages
                            ├─► Demander une absence
                            ├─► Consulter ses absences
                            ├─► Consulter ses heures sup
                            └─► Consulter ses notifications
```

---

## 🎬 Cas d'Utilisation

### UC1 : Authentification
**Acteur** : Tous les utilisateurs  
**Préconditions** : Aucune  
**Scénario principal** :
1. L'utilisateur accède à la page de connexion
2. Il saisit son email et mot de passe
3. Le système valide les identifiants
4. Le système génère un JWT token
5. L'utilisateur est redirigé vers le dashboard

**Scénario alternatif** : Identifiants incorrects → Message d'erreur

### UC2 : Pointage (Entrée)
**Acteur** : Employé  
**Préconditions** : Employé connecté, pas de pointage en cours  
**Scénario principal** :
1. L'employé accède à la page de pointage
2. Il clique sur "Pointer l'entrée"
3. Le système enregistre l'heure actuelle
4. Le statut du pointage passe à "PENDING"
5. Confirmation affichée

### UC3 : Pointage (Sortie) avec Calcul Automatique
**Acteur** : Employé  
**Préconditions** : Pointage d'entrée existant pour aujourd'hui  
**Scénario principal** :
1. L'employé clique sur "Pointer la sortie"
2. Le système enregistre l'heure de sortie
3. Le système calcule les heures travaillées
4. Le système récupère le cycle de travail et l'horaire de l'employé
5. Le système décompose les heures par plages horaires (normales, sup, nuit, dimanche, férié)
6. Le système crée automatiquement des enregistrements Overtime/SpecialHour si nécessaire
7. Le statut passe à "COMPLETED"
8. Le détail du calcul est stocké dans `validationErrors` (JSON)

### UC4 : Gestion des Employés
**Acteur** : Admin/Manager  
**Préconditions** : Utilisateur connecté avec rôle approprié  
**Scénario principal** :
1. Accès à la page employés
2. Liste de tous les employés affichée
3. Actions possibles :
   - Créer un nouvel employé (formulaire)
   - Modifier un employé existant
   - Supprimer un employé (soft delete)
   - Importer en masse via CSV
4. Validation des données
5. Sauvegarde en base

### UC5 : Configuration d'un Horaire avec Périodes
**Acteur** : Admin  
**Préconditions** : Admin connecté  
**Scénario principal** :
1. Accès à la page horaires
2. Création d'un nouvel horaire :
   - Nom, type, jour de la semaine
   - Heures de début/fin globales (optionnel)
3. Ajout de périodes :
   - Nom (ex: "Matin")
   - Heures début/fin
   - Type de période
4. Pour chaque période, ajout de plages horaires :
   - Nom (ex: "Heures normales")
   - Heures début/fin
   - Type (NORMAL, OVERTIME, NIGHT_SHIFT, etc.)
   - Multiplicateur (ex: 1.25 pour 25% de majoration)
5. Sauvegarde

### UC6 : Attribution d'un Horaire à un Cycle de Travail
**Acteur** : Admin  
**Préconditions** : Cycle et horaire existants  
**Scénario principal** :
1. Accès à la page cycles de travail
2. Sélection d'un cycle
3. Action "Attribuer un horaire"
4. Sélection d'un horaire existant
5. Choix du jour de la semaine
6. Option "Horaire par défaut"
7. Sauvegarde de la relation WorkCycleSchedule

### UC7 : Validation d'un Pointage
**Acteur** : Admin/Manager  
**Préconditions** : Pointage complet existant, non validé  
**Scénario principal** :
1. Accès à la page validation
2. Liste des pointages en attente
3. Consultation du détail (heures, calculs)
4. Validation ou rejet avec commentaire
5. Notification envoyée à l'employé

### UC8 : Demande d'Absence
**Acteur** : Employé  
**Préconditions** : Employé connecté  
**Scénario principal** :
1. Accès à la page absences
2. Création d'une nouvelle demande
3. Sélection du type d'absence
4. Saisie des dates début/fin
5. Calcul automatique du nombre de jours
6. Saisie optionnelle d'un motif
7. Soumission (statut PENDING)
8. Notification envoyée au manager

---

## 🔌 API Endpoints

### Authentification

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/auth/register` | Créer un compte | Non |
| POST | `/api/auth/login` | Se connecter | Non |
| GET | `/api/auth/me` | Obtenir l'utilisateur courant | Oui |

### Employés

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/employees` | Liste tous les employés | Oui |
| GET | `/api/employees/:id` | Détails d'un employé | Oui |
| POST | `/api/employees` | Créer un employé | Admin/Manager |
| PUT | `/api/employees/:id` | Modifier un employé | Admin/Manager |
| DELETE | `/api/employees/:id` | Supprimer un employé | Admin |
| POST | `/api/employees/import` | Import CSV | Admin |

### Pointages

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/time-entries` | Liste des pointages | Oui |
| GET | `/api/time-entries/:id` | Détails d'un pointage | Oui |
| POST | `/api/time-entries/clock-in` | Pointer l'entrée | Employee |
| POST | `/api/time-entries/clock-out` | Pointer la sortie | Employee |
| PUT | `/api/time-entries/:id/validate` | Valider un pointage | Admin/Manager |

### Cycles de Travail

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/work-cycles` | Liste des cycles | Oui |
| POST | `/api/work-cycles` | Créer un cycle | Admin |
| PUT | `/api/work-cycles/:id` | Modifier un cycle | Admin |
| POST | `/api/work-cycles/:id/schedules` | Attribuer un horaire | Admin |
| DELETE | `/api/work-cycles/:id/schedules/:scheduleId` | Retirer un horaire | Admin |

### Horaires

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/schedules` | Liste des horaires | Oui |
| POST | `/api/schedules` | Créer un horaire | Admin |
| PUT | `/api/schedules/:id` | Modifier un horaire | Admin |
| GET | `/api/schedules/:id/periods` | Périodes d'un horaire | Oui |

### Périodes

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/periods` | Liste des périodes | Oui |
| POST | `/api/periods` | Créer une période | Admin |
| PUT | `/api/periods/:id` | Modifier une période | Admin |
| DELETE | `/api/periods/:id` | Supprimer une période | Admin |

### Plages Horaires

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/time-ranges` | Liste des plages | Oui |
| POST | `/api/time-ranges` | Créer une plage | Admin |
| PUT | `/api/time-ranges/:id` | Modifier une plage | Admin |
| DELETE | `/api/time-ranges/:id` | Supprimer une plage | Admin |

### Absences

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/absences` | Liste des absences | Oui |
| POST | `/api/absences` | Créer une demande | Employee |
| PUT | `/api/absences/:id` | Modifier une absence | Employee |
| PUT | `/api/absences/:id/approve` | Approuver | Admin/Manager |
| PUT | `/api/absences/:id/reject` | Rejeter | Admin/Manager |

### Heures Supplémentaires

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/overtimes` | Liste des heures sup | Oui |
| POST | `/api/overtimes` | Créer manuellement | Admin/Manager |
| PUT | `/api/overtimes/:id/approve` | Approuver | Admin/Manager |

### Heures Spéciales

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/special-hours` | Liste des heures spéciales | Oui |
| POST | `/api/special-hours` | Créer manuellement | Admin/Manager |
| PUT | `/api/special-hours/:id/approve` | Approuver | Admin/Manager |

### Unités Organisationnelles

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/organizational-units` | Liste des unités | Oui |
| GET | `/api/organizational-units/tree` | Arbre hiérarchique | Oui |
| POST | `/api/organizational-units` | Créer une unité | Admin |
| PUT | `/api/organizational-units/:id` | Modifier une unité | Admin |

### Notifications

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/notifications` | Liste des notifications | Oui |
| GET | `/api/notifications/unread-count` | Compteur non lus | Oui |
| PUT | `/api/notifications/:id/read` | Marquer comme lu | Oui |

### Logs d'Audit

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/audit-logs` | Liste des logs | Admin |
| GET | `/api/audit-logs/:id` | Détails d'un log | Admin |

### Rapports

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/reports/employee/:id` | Rapport employé | Oui |
| GET | `/api/reports/department/:id` | Rapport département | Admin/Manager |
| GET | `/api/reports/overtime` | Rapport heures sup | Admin/Manager |

---

## ⚙️ Fonctionnalités Principales

### 1. Gestion des Employés

- **CRUD complet** : Création, lecture, mise à jour, suppression (soft delete)
- **Import CSV** : Import en masse d'employés
- **Recherche et filtres** : Par nom, numéro, unité organisationnelle
- **Assignation** : À une unité organisationnelle et un cycle de travail

### 2. Système de Pointage

- **Pointage entrée/sortie** : Enregistrement horaire précis
- **Validation** : Impossible de pointer à une date future (N+1)
- **Calcul automatique** : Détection et calcul des heures sup/spéciales
- **Statuts** : PENDING, COMPLETED, INCOMPLETE, ABSENT

### 3. Calcul Automatique des Heures

#### Fonctionnement

Le système calcule automatiquement les heures normales, supplémentaires et spéciales lors du pointage de sortie :

1. **Récupération du contexte** :
   - Cycle de travail de l'employé
   - Horaire assigné au cycle pour le jour de la semaine
   - Périodes et plages horaires de l'horaire

2. **Calcul par intersection** :
   - Intersection entre les heures travaillées et les plages horaires
   - Application des multiplicateurs
   - Détection des heures de nuit, dimanche, férié

3. **Dépassement de seuil** :
   - Si les heures accumulées dans le cycle dépassent le seuil, conversion en heures sup

4. **Création automatique** :
   - Création d'enregistrements `Overtime` si heures sup > 0
   - Création d'enregistrements `SpecialHour` si heures spéciales > 0
   - Prévention des doublons (un seul enregistrement par jour)

#### Exemple de Calcul

```
Employé : Cycle hebdomadaire (40h/semaine)
Horaire : 9h-17h avec périodes :
  - Matin (9h-12h) → Plage normale (1.0x)
  - Après-midi (13h-17h) → Plage normale (1.0x)
  - Soirée (18h-22h) → Plage sup (1.25x)

Pointage : 8h30 - 19h30

Calcul :
- 8h30-9h : 0.5h hors horaire → 0.5h sup
- 9h-12h : 3h normale → 3h normale
- 12h-13h : 1h pause → 0h
- 13h-17h : 4h normale → 4h normale
- 17h-18h : 1h hors horaire → 1h sup
- 18h-19h30 : 1.5h soirée → 1.5h × 1.25 = 1.875h sup

Total :
- Normales : 7h
- Supplémentaires : 3.375h
```

### 4. Gestion des Horaires Avancée

- **Structure hiérarchique** :
  - Horaire → Périodes → Plages horaires
- **Types de périodes** : REGULAR, BREAK, OVERTIME, SPECIAL
- **Types de plages** : NORMAL, OVERTIME, NIGHT_SHIFT, SUNDAY, HOLIDAY, SPECIAL
- **Multiplicateurs** : Configuration de majorations (ex: 1.25 = 25%)
- **Association aux cycles** : Via WorkCycleSchedule avec jour de la semaine

### 5. Gestion des Absences

- **Types** : VACATION, SICK_LEAVE, PERSONAL, MATERNITY, PATERNITY, UNPAID_LEAVE, OTHER
- **Workflow d'approbation** : PENDING → APPROVED/REJECTED
- **Calcul automatique** : Nombre de jours ouvrés
- **Notifications** : Alertes pour les managers

### 6. Heures Supplémentaires et Spéciales

- **Création automatique** : Via le calcul de pointage
- **Création manuelle** : Par admin/manager
- **Types spéciaux** : HOLIDAY, NIGHT_SHIFT, WEEKEND, ON_CALL
- **Approval workflow** : Nécessite validation

### 7. Structure Organisationnelle

- **Hiérarchie** : Arbre avec parent/enfants
- **Visualisation** : Vue en arbre
- **Assignation** : Employés liés à des unités

### 8. Système de Notifications

- **Types** : INFO, WARNING, ERROR, SUCCESS, APPROVAL_REQUEST, SYSTEM_ALERT
- **Lecture** : Suivi des notifications non lues
- **Notifications automatiques** :
  - Demande d'absence → Manager
  - Validation pointage → Employé
  - Heures sup créées → Manager

### 9. Audit et Traçabilité

- **Enregistrement automatique** : Toutes les actions CRUD
- **Informations stockées** :
  - Utilisateur, action, modèle, anciennes/nouvelles valeurs
  - IP, User-Agent, timestamp
- **Consultation** : Logs accessibles aux admins

### 10. Rapports et Statistiques

- **Rapports employé** : Heures travaillées, absences, heures sup
- **Rapports département** : Statistiques par unité organisationnelle
- **Rapports heures sup** : Agrégation et analyse

---

## 🔄 Flux de Données

### Flux d'Authentification

```
1. User → Frontend (Login form)
2. Frontend → Backend POST /api/auth/login
3. Backend → Vérification email/password (bcrypt)
4. Backend → Génération JWT token
5. Backend → Frontend (token + user data)
6. Frontend → Stockage token dans localStorage
7. Frontend → Redirection dashboard
8. Frontend → Intercepteur Axios ajoute token aux requêtes
```

### Flux de Pointage avec Calcul

```
1. Employee → Frontend (Clock Out button)
2. Frontend → Backend POST /api/time-entries/clock-out
3. Backend → Middleware auth (vérification JWT)
4. Backend → Controller timeEntry.clockOut()
5. Backend → Prisma update TimeEntry
6. Backend → overtimeCalculator.calculateHoursWorked()
   └─> Récupération Employee + WorkCycle + Schedule
   └─> Calcul intersection heures/plages horaires
   └─> Décomposition par types (normale, sup, nuit, dimanche, férié)
7. Backend → overtimeCalculator.autoCreateOvertimeAndSpecialHours()
   └─> Vérification doublons (déjà un enregistrement pour ce jour)
   └─> Création Overtime si heures sup > 0
   └─> Création SpecialHour si heures spéciales > 0
8. Backend → Stockage breakdown dans TimeEntry.validationErrors (JSON)
9. Backend → Frontend (success + calculated hours)
10. Frontend → Affichage confirmation + détails calcul
```

### Flux d'Import CSV Employés

```
1. Admin → Frontend (Upload CSV file)
2. Frontend → Backend POST /api/employees/import (multipart/form-data, 50MB limit)
3. Backend → Middleware auth (vérification admin)
4. Backend → Controller employee.importCSV()
5. Backend → Parsing CSV
6. Backend → Validation chaque ligne
7. Backend → Transaction Prisma (tous ou rien)
   └─> Pour chaque ligne :
       - Création Employee
       - Création User (si email fourni)
       - Liaison Employee-User
       - Assignation OrganizationalUnit
       - Assignation WorkCycle
8. Backend → Logs d'audit (création multiple)
9. Backend → Frontend (success + nombre d'employés créés)
10. Frontend → Affichage résultat
```

---

## 🔧 Configuration et Déploiement

### Variables d'Environnement Backend (.env)

```env
# Serveur
PORT=8008
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Base de données
DATABASE_URL="mysql://user:password@localhost:3306/gta_db"

# JWT
JWT_SECRET=votre_secret_jwt_tres_securise
JWT_EXPIRES_IN=7d

# Autres
BCRYPT_ROUNDS=10
```

### Variables d'Environnement Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8008/api
```

### Installation

#### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed  # Optionnel
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Migration de la Base de Données

```bash
cd backend
npx prisma migrate dev --name nom_de_la_migration
npx prisma generate
```

### Génération du Client Prisma

```bash
cd backend
npx prisma generate
```

### Seed (Données de Test)

```bash
cd backend
npm run prisma:seed
```

---

## 📝 Notes Techniques

### Sécurité

- **JWT** : Tokens sécurisés avec expiration
- **bcrypt** : Hashage des mots de passe (10 rounds)
- **CORS** : Configuration restrictive
- **Validation** : express-validator pour toutes les entrées
- **Soft Delete** : Suppression logique (pas de suppression physique)

### Performance

- **Indexes** : Sur les champs fréquemment recherchés (email, employeeNumber)
- **Pagination** : Implémentée sur les listes
- **Transactions** : Pour les opérations multiples (import CSV)
- **Lazy Loading** : Relations Prisma chargées à la demande

### Extensibilité

- **Modulaire** : Contrôleurs, routes, middlewares séparés
- **Types TypeScript** : Typage strict partout
- **Enums centralisés** : `frontend/lib/constants.ts`
- **Composants réutilisables** : UI components dans `components/ui/`

---

## 🚀 Améliorations Futures

### Court Terme

- [ ] Module de gestion des jours fériés (table Holidays)
- [ ] Export PDF des rapports
- [ ] Notifications en temps réel (WebSockets)
- [ ] Dashboard avec graphiques (Chart.js)

### Moyen Terme

- [ ] Application mobile (React Native)
- [ ] API GraphQL alternative
- [ ] Système de permissions granulaires
- [ ] Multi-tenant (plusieurs entreprises)

### Long Terme

- [ ] Intelligence artificielle pour détection anomalies
- [ ] Intégration avec systèmes de paie
- [ ] Géolocalisation des pointages
- [ ] Reconnaissance faciale pour pointage

---

## 📞 Support

Pour toute question ou problème, consultez :
- Documentation Prisma : https://www.prisma.io/docs
- Documentation Next.js : https://nextjs.org/docs
- Documentation Express : https://expressjs.com/

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2025-01-03  
**Auteur** : Équipe de développement GTA

