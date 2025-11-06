# 🔌 Guide d'Intégration Frontend-Backend

Ce document explique comment le frontend Next.js doit communiquer avec le backend Express.

## ✅ Configuration Frontend Existante

Votre frontend est déjà configuré ! Le fichier `frontend/lib/api.ts` contient toutes les fonctions nécessaires.

### Configuration de Base

```typescript
// frontend/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008/api';
```

**Important :** Le backend écoute sur le port **8008**, pas 3000 !

## 🚀 Démarrage

### 1. Démarrer le Backend
```bash
cd backend
npm run dev
# Serveur démarré sur http://localhost:8008
```

### 2. Démarrer le Frontend
```bash
cd frontend
npm run dev
# Frontend démarré sur http://localhost:3000
```

### 3. Tester la Connexion

**Dans le navigateur :**
1. Allez sur http://localhost:3000/login
2. Connectez-vous avec :
   - Email: `admin@gta.com`
   - Mot de passe: `admin123`
3. Vous devriez être redirigé vers `/dashboard`

## 📋 Correspondance Frontend ↔ Backend

### Authentification

#### Frontend (existant)
```typescript
// frontend/lib/api.ts
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (email: string, password: string) => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  },
};
```

#### Backend (créé)
```
POST /api/auth/login
POST /api/auth/register
GET /api/auth/profile
```

**Réponse attendue :**
```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@gta.com",
    "role": "ADMIN",
    "employee": {
      "id": 1,
      "employeeNumber": "EMP001",
      "firstName": "Jean",
      "lastName": "Dupont"
    }
  }
}
```

### Employés

#### Frontend Existant
```typescript
export const employeesAPI = {
  getAll: () => api.get('/employees').then((res) => res.data),
  getById: (id: number) => api.get(`/employees/${id}`).then((res) => res.data),
  create: (data: any) => api.post('/employees', data).then((res) => res.data),
  update: (id: number, data: any) => api.put(`/employees/${id}`, data).then((res) => res.data),
  delete: (id: number) => api.delete(`/employees/${id}`).then((res) => res.data),
  bulkImport: (items: any[]) => api.post('/employees/bulk', items).then((res) => res.data),
};
```

#### Backend Créé ✅
```
GET    /api/employees           → Liste des employés
GET    /api/employees/:id       → Détails d'un employé
POST   /api/employees           → Créer un employé
PUT    /api/employees/:id       → Modifier un employé
DELETE /api/employees/:id       → Supprimer un employé
POST   /api/employees/bulk      → Import CSV
```

**Format de création d'employé :**
```json
{
  "employeeNumber": "EMP004",
  "firstName": "Sophie",
  "lastName": "Dubois",
  "email": "sophie.dubois@gta.com",
  "phone": "0612345678",
  "gender": "FEMALE",
  "hireDate": "2024-01-15",
  "contractType": "FULL_TIME",
  "status": "ACTIVE",
  "organizationalUnitId": 2,
  "workCycleId": 1
}
```

### Pointages (Time Entries)

#### Frontend Existant
```typescript
export const timeEntriesAPI = {
  getByEmployee: (employeeId: number, startDate?: string, endDate?: string) =>
    api.get(`/time-entries/employee/${employeeId}`, { params: { startDate, endDate } }),
  clockIn: (employeeId: number, data?: any) =>
    api.post(`/time-entries/${employeeId}/clock-in`, data),
  clockOut: (employeeId: number, data?: any) =>
    api.post(`/time-entries/${employeeId}/clock-out`, data),
  getBalance: (employeeId: number, startDate: string, endDate: string) =>
    api.get(`/time-entries/employee/${employeeId}/balance`, { params: { startDate, endDate } }),
  validate: (id: number, autoCorrect?: boolean) =>
    api.post(`/time-entries/${id}/validate`, {}, { params: { autoCorrect } }),
};
```

#### Backend Créé ✅
Toutes les routes sont implémentées !

**Exemple de pointage d'entrée :**
```bash
POST /api/time-entries/1/clock-in
Authorization: Bearer <token>
Content-Type: application/json

{}

# Réponse
{
  "message": "Pointage d'entrée enregistré",
  "data": {
    "id": 15,
    "employeeId": 1,
    "date": "2025-11-02T00:00:00.000Z",
    "clockIn": "2025-11-02T08:30:00.000Z",
    "clockOut": null,
    "totalHours": null,
    "status": "PENDING"
  }
}
```

### Absences

#### Frontend Existant
```typescript
export const absencesAPI = {
  getAll: () => api.get('/absences').then((res) => res.data),
  getByEmployee: (employeeId: number) =>
    api.get(`/absences/employee/${employeeId}`).then((res) => res.data),
  create: (data: any) => api.post('/absences', data).then((res) => res.data),
  approve: (id: number, status: string, approvedBy: number) =>
    api.patch(`/absences/${id}/approve`, { status, approvedBy }),
};
```

#### Backend Créé ✅
```
GET   /api/absences                       → Liste de toutes les absences
GET   /api/absences/employee/:employeeId  → Absences d'un employé
POST  /api/absences                       → Créer une absence
PATCH /api/absences/:id/approve           → Approuver/Rejeter
```

**Exemple de création d'absence :**
```json
{
  "employeeId": 1,
  "absenceType": "VACATION",
  "startDate": "2025-12-20",
  "endDate": "2025-12-31",
  "days": 8,
  "reason": "Congés de fin d'année"
}
```

**Approbation/Rejet :**
```json
{
  "status": "APPROVED",
  "approvedBy": 1
}
```

### Cycles de Travail

#### Frontend Existant
```typescript
export const workCyclesAPI = {
  getAll: () => api.get('/work-cycles').then((res) => res.data),
  getById: (id: number) => api.get(`/work-cycles/${id}`).then((res) => res.data),
  create: (data: any) => api.post('/work-cycles', data).then((res) => res.data),
  update: (id: number, data: any) => api.put(`/work-cycles/${id}`, data),
  delete: (id: number) => api.delete(`/work-cycles/${id}`),
};
```

#### Backend Créé ✅
Toutes les routes correspondent exactement !

### Unités Organisationnelles

#### Frontend Existant
```typescript
export const organizationalUnitsAPI = {
  getAll: () => api.get('/organizational-units').then((res) => res.data),
  getTree: () => api.get('/organizational-units/tree').then((res) => res.data),
  getRoots: () => api.get('/organizational-units/roots').then((res) => res.data),
  getById: (id: number) => api.get(`/organizational-units/${id}`).then((res) => res.data),
  getChildren: (id: number) => api.get(`/organizational-units/${id}/children`),
  create: (data: any) => api.post('/organizational-units', data),
  update: (id: number, data: any) => api.put(`/organizational-units/${id}`, data),
  delete: (id: number) => api.delete(`/organizational-units/${id}`),
};
```

#### Backend Créé ✅
Toutes les routes sont implémentées, y compris la gestion hiérarchique !

## 🔐 Gestion de l'Authentification

### Flux d'Authentification

1. **Login** → Reçoit le token JWT
2. **Stockage** → localStorage (déjà fait dans le frontend)
3. **Utilisation** → Le token est automatiquement ajouté à chaque requête

```typescript
// frontend/lib/api.ts (déjà implémenté)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Gestion de l'Expiration

```typescript
// frontend/lib/api.ts (déjà implémenté)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## 🐛 Problèmes Courants et Solutions

### 1. CORS Error

**Erreur :**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution :**
Vérifiez que le backend a bien démarré sur le port 8008 et que `CORS_ORIGIN="http://localhost:3000"` est dans le `.env`

### 2. 401 Unauthorized

**Erreur :**
```
401 Unauthorized - Token invalide ou expiré
```

**Solutions :**
- Vérifiez que vous êtes bien connecté
- Le token peut avoir expiré (reconnectez-vous)
- Vérifiez que le token est bien envoyé dans le header

### 3. Connection Refused

**Erreur :**
```
Failed to fetch - ERR_CONNECTION_REFUSED
```

**Solutions :**
- Le backend n'est pas démarré
- Vérifiez le port (doit être 8008)
- Vérifiez l'URL dans `NEXT_PUBLIC_API_URL`

### 4. 404 Not Found

**Erreur :**
```
404 - Route not found
```

**Solutions :**
- Vérifiez l'URL de la requête
- Toutes les routes backend commencent par `/api/`
- Exemple correct : `http://localhost:8008/api/employees`

## 🧪 Tests avec Postman/Insomnia

### 1. Login
```
POST http://localhost:8008/api/auth/login
Content-Type: application/json

{
  "email": "admin@gta.com",
  "password": "admin123"
}
```

### 2. Récupérer les Employés
```
GET http://localhost:8008/api/employees
Authorization: Bearer <votre_token>
```

### 3. Créer un Employé
```
POST http://localhost:8008/api/employees
Authorization: Bearer <votre_token>
Content-Type: application/json

{
  "employeeNumber": "EMP999",
  "firstName": "Test",
  "lastName": "User",
  "hireDate": "2025-01-01",
  "contractType": "FULL_TIME",
  "status": "ACTIVE"
}
```

## 📊 Format des Réponses

Toutes les réponses du backend suivent ces formats :

### Succès (Liste)
```json
{
  "data": [...]
}
```

### Succès (Création/Modification)
```json
{
  "message": "Opération réussie",
  "data": {...}
}
```

### Erreur
```json
{
  "message": "Description de l'erreur",
  "errors": [
    {
      "field": "email",
      "message": "Email invalide"
    }
  ]
}
```

## ✅ Checklist d'Intégration

- [ ] Backend démarré sur port 8008
- [ ] Frontend démarré sur port 3000
- [ ] Variables d'environnement configurées
- [ ] Base de données créée et migrée
- [ ] Données de test insérées (seed)
- [ ] Login fonctionnel
- [ ] Token JWT reçu et stocké
- [ ] Routes protégées accessibles
- [ ] CORS configuré correctement

## 🎯 Prochaines Étapes

1. **Tester le login** sur http://localhost:3000/login
2. **Naviguer** vers les différentes pages
3. **Créer un employé** depuis l'interface
4. **Tester les pointages** (clock-in/clock-out)
5. **Créer une absence** et l'approuver
6. **Consulter les rapports**

## 📚 Ressources

- **API Backend:** http://localhost:8008/api
- **Health Check:** http://localhost:8008/api/health
- **Prisma Studio:** `npm run prisma:studio` dans backend/
- **Frontend:** http://localhost:3000

## 🆘 Support

Si quelque chose ne fonctionne pas :

1. Vérifiez les logs du backend dans le terminal
2. Ouvrez la console du navigateur (F12)
3. Vérifiez l'onglet Network pour voir les requêtes
4. Consultez les fichiers de documentation

**Tout est prêt ! Le frontend et le backend devraient communiquer parfaitement ! 🚀**

