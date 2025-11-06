# 📊 Guide d'Import CSV - Employés

## 📁 Fichiers CSV de Test Créés

Deux fichiers CSV sont disponibles pour tester l'import :

1. **`test-import-employees.csv`** (racine du projet)
   - 21 employés de test
   - Toutes les colonnes remplies
   - Prêt à l'emploi

2. **`backend/test-import-employees.csv`** (dossier backend)
   - Copie identique
   - 30 employés de test

## 🔧 Correction Appliquée

**Problème** : Erreur 413 (Payload Too Large)

**Solution** : Limite de taille augmentée dans `backend/src/app.ts`
```typescript
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
```

**Capacité** : Jusqu'à 50 MB (environ 500 000 employés)

## 📋 Format du Fichier CSV

### Colonnes Obligatoires
- `employeeNumber` - Numéro unique de l'employé
- `firstName` - Prénom
- `lastName` - Nom
- `hireDate` - Date d'embauche (format YYYY-MM-DD)

### Colonnes Optionnelles
- `email` - Email professionnel
- `phone` - Numéro de téléphone
- `gender` - MALE, FEMALE, UNKNOWN
- `contractType` - FULL_TIME, PART_TIME, INTERIM, CONTRACT
- `status` - ACTIVE, INACTIVE, SUSPENDED, TERMINATED
- `organizationalUnitId` - ID de l'unité (1, 2, 3, etc.)
- `workCycleId` - ID du cycle de travail (1, 2, etc.)

### Exemple de Ligne CSV
```csv
employeeNumber,firstName,lastName,email,phone,gender,hireDate,contractType,status,organizationalUnitId,workCycleId
EMP010,Sophie,Dubois,sophie.dubois@gta.com,0612345678,FEMALE,2024-01-15,FULL_TIME,ACTIVE,2,1
```

## 🚀 Comment Utiliser

### Méthode 1 : Utiliser le Fichier de Test

1. Allez sur http://localhost:3000/employees
2. Cliquez sur **"Importer CSV"**
3. Sélectionnez le fichier **`test-import-employees.csv`** (à la racine du projet)
4. L'import se lance automatiquement
5. Vous verrez un message : **"Créés: 21 — Ignorés: 0"**

### Méthode 2 : Créer Votre Propre CSV

1. Créez un nouveau fichier avec Excel, LibreOffice, ou un éditeur de texte
2. Copiez la première ligne (en-têtes) :
   ```
   employeeNumber,firstName,lastName,email,phone,gender,hireDate,contractType,status,organizationalUnitId,workCycleId
   ```
3. Ajoutez vos employés ligne par ligne
4. Sauvegardez au format CSV
5. Importez dans l'interface

## 📊 Données dans le Fichier de Test

Le fichier contient **21 employés** avec :

### Répartition par Genre
- 👨 Hommes : 11
- 👩 Femmes : 10

### Répartition par Type de Contrat
- Temps plein : 16
- Temps partiel : 3
- Intérim : 2
- Contrat : 2

### Répartition par Unité Organisationnelle
- Direction Générale (ID: 1) : 6 employés
- DSI (ID: 2) : 10 employés
- DRH (ID: 3) : 5 employés

### Répartition par Cycle de Travail
- Cycle 40h (ID: 1) : 13 employés
- Cycle 35h (ID: 2) : 8 employés

### Dates d'Embauche
- 2023 : 11 employés
- 2024 : 10 employés

Tous les employés ont le statut **ACTIVE**.

## ✅ Résultat Attendu

Après l'import, vous devriez voir :

```
Créés: 21
Ignorés: 0
```

Si vous réimportez le même fichier :
```
Créés: 0
Ignorés: 21
```

Car les numéros d'employés sont uniques et déjà présents.

## 🎯 Test Avancé - Import Partiel

Créez un fichier CSV minimal avec seulement les champs requis :

```csv
employeeNumber,firstName,lastName,hireDate
EMP050,Test,User,2024-11-02
EMP051,Test2,User2,2024-11-02
```

Cela devrait fonctionner aussi ! Les valeurs par défaut seront :
- gender: UNKNOWN
- contractType: FULL_TIME
- status: ACTIVE
- email, phone: null
- organizationalUnitId, workCycleId: null

## 📝 Règles d'Import

### ✅ Comportement
- Les numéros d'employés **existants** sont **ignorés** (pas d'erreur)
- Les nouveaux employés sont **créés**
- Les erreurs de validation sont **reportées** dans les résultats

### ⚠️ Attention
- Les **numéros d'employés** doivent être **uniques**
- Les **dates** doivent être au format **YYYY-MM-DD**
- Les **enums** doivent être en **MAJUSCULES**
- Pas d'espaces avant/après les virgules dans le CSV

## 🐛 Résolution de Problèmes

### Erreur : "CSV vide ou en-têtes absents"
→ Vérifiez que la première ligne contient les en-têtes

### Erreur : "Référence invalide" (organizationalUnitId)
→ L'ID de l'unité organisationnelle n'existe pas
→ Utilisez 1, 2, ou 3 (créés par le seed)
→ Ou laissez vide

### Erreur : "Invalid enum value"
→ Vérifiez que les valeurs des enums sont correctes :
- gender: MALE, FEMALE, UNKNOWN
- contractType: FULL_TIME, PART_TIME, INTERIM, CONTRACT
- status: ACTIVE, INACTIVE, SUSPENDED, TERMINATED

### Import ne démarre pas
→ Vérifiez que le backend est démarré
→ Vérifiez la console du navigateur (F12)
→ Vérifiez que la limite a été augmentée dans app.ts

## 📊 Exemple de Gros Import

Pour tester avec beaucoup d'employés, vous pouvez générer un CSV avec Excel :

1. Ouvrez Excel
2. Utilisez des formules pour générer les données :
   - `="EMP"&TEXT(ROW()+9,"000")` pour employeeNumber
   - Noms aléatoires ou séquentiels
3. Exportez en CSV
4. Importez dans l'application

## ✨ Conseils

### Pour un Import Réussi
- ✅ Utilisez UTF-8 comme encodage
- ✅ Pas de caractères spéciaux dans les numéros
- ✅ Dates au format ISO (YYYY-MM-DD)
- ✅ Vérifiez les virgules dans le CSV

### Pour Tester
- 🧪 Commencez avec le fichier de test fourni
- 🧪 Ajoutez progressivement vos données
- 🧪 Vérifiez les résultats dans Prisma Studio

## 🎉 Résultat

Après un import réussi :
1. Les employés apparaissent dans la liste
2. Vous pouvez les modifier/supprimer
3. Ils sont visibles dans Prisma Studio
4. Ils peuvent être assignés à des pointages, absences, etc.

**Bon import ! 📊**

