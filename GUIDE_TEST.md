# 🧪 Guide de Test - Vérification Complète

Ce guide vous aide à tester toutes les fonctionnalités après les corrections.

---

## ✅ Prérequis

- [x] Backend démarré sur http://localhost:8008
- [x] Frontend démarré sur http://localhost:3000
- [x] Base de données MySQL créée et migrée
- [x] Données de test insérées (seed)

---

## 🚀 Tests Backend (API)

### Test 1 : Health Check

**URL** : http://localhost:8008/api/health

**Résultat attendu** :
```json
{
  "status": "OK",
  "timestamp": "...",
  "uptime": 123.456,
  "environment": "development"
}
```

✅ **PASS** si vous voyez le JSON

---

### Test 2 : Login

**Avec Postman/Insomnia/Thunder Client** :

```http
POST http://localhost:8008/api/auth/login
Content-Type: application/json

{
  "email": "admin@gta.com",
  "password": "admin123"
}
```

**Résultat attendu** :
```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@gta.com",
    "role": "ADMIN"
  }
}
```

✅ **PASS** si vous recevez un token

**💾 Sauvegardez le token** pour les tests suivants !

---

### Test 3 : Liste des Employés

```http
GET http://localhost:8008/api/employees
Authorization: Bearer VOTRE_TOKEN_ICI
```

**Résultat attendu** :
```json
{
  "data": [
    {
      "id": 1,
      "employeeNumber": "EMP001",
      "firstName": "Jean",
      "lastName": "Dupont",
      ...
    }
  ]
}
```

✅ **PASS** si vous voyez la liste des 3 employés

---

### Test 4 : Arbre Organisationnel (Corrigé)

```http
GET http://localhost:8008/api/organizational-units/tree
Authorization: Bearer VOTRE_TOKEN_ICI
```

**Résultat attendu** :
```json
{
  "data": [
    {
      "id": 1,
      "code": "DIR",
      "name": "Direction Générale",
      "children": [
        {
          "code": "DSI",
          "name": "Direction des Systèmes d'Information",
          "employees": [...]
        }
      ]
    }
  ]
}
```

✅ **PASS** si vous voyez l'arbre hiérarchique avec employés

---

## 🎨 Tests Frontend (Interface)

### Test 5 : Login Frontend

1. Allez sur http://localhost:3000/login
2. Connectez-vous avec :
   - **Email** : `admin@gta.com`
   - **Mot de passe** : `admin123`
3. Vous devriez être redirigé vers `/dashboard`

✅ **PASS** si la connexion fonctionne

---

### Test 6 : Création d'un Employé

1. Allez sur http://localhost:3000/employees
2. Cliquez sur "Ajouter un employé"
3. Remplissez le formulaire :
   - Numéro : `EMP999`
   - Prénom : `Test`
   - Nom : `Correction`
   - Date embauche : Date du jour
   - Genre : `Homme` ✅ (doit être dans la liste)
   - Type contrat : `Temps plein` ✅ (doit fonctionner)
   - Statut : `Actif` ✅ (doit fonctionner)
4. Cliquez sur "Créer"

✅ **PASS** si l'employé est créé sans erreur

---

### Test 7 : Création d'une Absence (Corrigé)

1. Allez sur http://localhost:3000/absences
2. Cliquez sur "Nouvelle absence"
3. Remplissez :
   - Employé : Sélectionnez un employé
   - **Type** : `Congés` ✅ (VACATION en interne)
   - Date début : Demain
   - Date fin : Dans 3 jours
   - Nombre de jours : `2`
   - Raison : `Test après correction`
4. Cliquez sur "Créer"

✅ **PASS** si l'absence est créée SANS erreur

**Avant correction** : ❌ Erreur "Invalid absenceType"  
**Après correction** : ✅ Création réussie

---

### Test 8 : Création d'un Horaire (Corrigé)

1. Allez sur http://localhost:3000/schedules
2. Cliquez sur "Nouvel horaire"
3. Remplissez :
   - Libellé : `Test Horaire`
   - Abrégé : `TST`
   - **Type d'horaire** : `Standard` ✅ (STANDARD en interne)
   - Heure début : `08:00`
   - Heure fin : `17:00`
   - Pause : `60` minutes
4. Cliquez sur "Créer"

✅ **PASS** si l'horaire est créé SANS erreur

**Avant correction** : ❌ Erreur "Invalid scheduleType: WORK"  
**Après correction** : ✅ Création réussie

---

### Test 9 : Création d'Heures Spéciales (Corrigé)

1. Allez sur http://localhost:3000/special-hours
2. Remplissez :
   - Employé : Sélectionnez un employé
   - Date : Date du jour
   - Heures : `2`
   - **Type** : `Jour férié` ✅ (HOLIDAY en interne)
   - Multiplicateur : `1.5`
3. Cliquez sur "Créer"

✅ **PASS** si les heures spéciales sont créées SANS erreur

**Avant correction** : ❌ Champ `specialType` incorrect  
**Après correction** : ✅ Champ `hourType` correct

---

### Test 10 : Cycle de Travail

1. Allez sur http://localhost:3000/work-cycles
2. Cliquez sur "Nouveau cycle"
3. Remplissez :
   - Libellé : `Test Cycle`
   - Abrégé : `TST`
   - **Type de cycle** : `Hebdomadaire` ✅ (WEEKLY)
   - Nombre de jours : `7`
   - Heures par semaine : `40`
4. Cliquez sur "Créer"

✅ **PASS** si le cycle est créé

---

### Test 11 : Pointages

1. Allez sur http://localhost:3000/time-entries
2. Sélectionnez un employé
3. Cliquez sur "Entrée" (bouton vert)
4. Attendez quelques secondes
5. Cliquez sur "Sortie" (bouton rouge)
6. Vérifiez que le pointage apparaît dans la liste

✅ **PASS** si le pointage est enregistré

---

## 📊 Tests de Validation

### Test 12 : Unités Organisationnelles (Corrigé)

1. Allez sur http://localhost:3000/organizational-units
2. Vous devriez voir l'arbre hiérarchique :
   - Direction Générale
     - DSI (avec employés)
     - DRH (avec employés)

✅ **PASS** si l'arbre s'affiche correctement

**Avant correction** : ❌ Erreur "Unknown argument employees"  
**Après correction** : ✅ Arbre affiché

---

### Test 13 : Notifications

1. Allez sur http://localhost:3000/notifications
2. Vous devriez voir au moins 1 notification de bienvenue

✅ **PASS** si les notifications s'affichent

---

## 🔍 Vérification des Données

### Via Prisma Studio

```bash
cd backend
npm run prisma:studio
```

Ouvre http://localhost:5555

**Vérifiez** :
- Table `users` : 1 utilisateur admin
- Table `employees` : 3 employés (EMP001, EMP002, EMP003)
- Table `organizational_units` : 3 unités
- Table `work_cycles` : 2 cycles
- Table `absences` : Vos absences créées
- Table `schedules` : Vos horaires créés
- Table `special_hours` : Vos heures spéciales

✅ **PASS** si toutes les données sont présentes

---

### Via MySQL Workbench ou PHPMyAdmin

**PHPMyAdmin** : http://localhost/phpmyadmin

1. Sélectionnez la base `gta_db` (ou `my_project`)
2. Vérifiez les tables
3. Consultez les données

✅ **PASS** si vous voyez toutes les tables

---

## 🎯 Tests de Régression

### Test 14 : Créer plusieurs absences avec différents types

Testez TOUS les types d'absences :
- ✅ Congés (VACATION)
- ✅ Maladie (SICK_LEAVE)
- ✅ Personnel (PERSONAL)
- ✅ Maternité (MATERNITY)
- ✅ Paternité (PATERNITY)
- ✅ Sans solde (UNPAID_LEAVE)
- ✅ Autre (OTHER)

Tous doivent fonctionner SANS erreur.

---

### Test 15 : Créer plusieurs horaires avec différents types

Testez TOUS les types d'horaires :
- ✅ Standard (STANDARD)
- ✅ Nuit (NIGHT_SHIFT)
- ✅ Flexible (FLEXIBLE)
- ✅ Personnalisé (CUSTOM)

Tous doivent fonctionner SANS erreur.

---

## 📝 Résultats Attendus

### Après Tous les Tests

```
✅ Test 1 : Health Check - PASS
✅ Test 2 : Login API - PASS
✅ Test 3 : Liste Employés - PASS
✅ Test 4 : Arbre Organisationnel - PASS
✅ Test 5 : Login Frontend - PASS
✅ Test 6 : Création Employé - PASS
✅ Test 7 : Création Absence - PASS
✅ Test 8 : Création Horaire - PASS
✅ Test 9 : Création Heures Spéciales - PASS
✅ Test 10 : Création Cycle Travail - PASS
✅ Test 11 : Pointages - PASS
✅ Test 12 : Unités Organisationnelles - PASS
✅ Test 13 : Notifications - PASS
✅ Test 14 : Types d'Absences - PASS
✅ Test 15 : Types d'Horaires - PASS

Score : 15/15 ✅
```

---

## 🐛 Si un Test Échoue

### Consultez les Logs

**Backend** : Regardez le terminal où `npm run dev` tourne

**Frontend** : Ouvrez la console du navigateur (F12)

### Vérifiez les Données

```bash
cd backend
npm run prisma:studio
```

### Consultez la Documentation

- `RAPPORT_CORRECTIONS.md` - Liste des corrections
- `CORRECTIONS_EFFECTUEES.md` - Détails des changements
- `backend/README.md` - Documentation complète

---

## ✨ Résumé des Corrections Testées

| Fonctionnalité | Avant | Après | Test |
|----------------|-------|-------|------|
| Absences | ❌ Types incorrects | ✅ Types valides | Test 7, 14 |
| Horaires | ❌ scheduleType invalide | ✅ scheduleType valide | Test 8, 15 |
| Heures Spéciales | ❌ Champ incorrect | ✅ Champ hourType | Test 9 |
| Arbre Organisationnel | ❌ Syntaxe Prisma | ✅ Syntaxe corrigée | Test 4, 12 |

---

## 🎉 Conclusion

Si **TOUS les tests passent** :
- ✅ Le backend est 100% fonctionnel
- ✅ Le frontend est 100% fonctionnel
- ✅ La synchronisation Backend ↔ Frontend est parfaite
- ✅ Toutes les corrections sont effectives

**Votre application GTA est prête pour le développement ! 🚀**

---

## 📞 Support

Si un test échoue :
1. Vérifiez les logs du serveur
2. Consultez `RAPPORT_CORRECTIONS.md`
3. Vérifiez que le serveur backend est bien démarré
4. Vérifiez la console du navigateur (F12)

**Tests validés = Application fonctionnelle ! ✅**

