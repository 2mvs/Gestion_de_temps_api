# ⚙️ Système de Calcul Automatique des Heures Supplémentaires et Spéciales

**Date** : 2 novembre 2025  
**Version** : 1.0.0  
**Statut** : ✅ Implémenté

---

## 🎯 Vue d'Ensemble

Le système calcule **automatiquement** les heures supplémentaires et spéciales lorsqu'un employé pointe sa sortie. Le calcul se base sur :

1. **L'horaire assigné** à l'employé (via son cycle de travail)
2. **Les périodes** définies dans l'horaire (Matin, Après-midi, Nuit)
3. **Les plages horaires** avec leurs multiplicateurs (Normal x1.0, Sup x1.25, Nuit x1.5, etc.)
4. **Les jours spéciaux** (Dimanche, jours fériés)

---

## 🔄 Flux de Fonctionnement

### 1. Pointage de Sortie

```
Employé pointe sa sortie
  ↓
clockOut() est appelé
  ↓
Pointage enregistré dans la base
  ↓
calculateHoursWorked() est appelé
  ↓
Décomposition par plages horaires
  ↓
autoCreateOvertimeAndSpecialHours() crée les enregistrements
  ↓
Résultat sauvegardé dans TimeEntry.validationErrors
```

---

## 📊 Logique de Calcul

### Étape 1 : Récupération du Cycle et Horaire

```typescript
1. Récupérer l'employé avec son cycle de travail
2. Trouver l'horaire correspondant au jour de la semaine
   - Si pas d'horaire pour ce jour → utiliser l'horaire par défaut (isDefault)
   - Si pas d'horaire du tout → toutes les heures sont normales
```

### Étape 2 : Calcul par Intersection de Plages

```
Pour chaque période de l'horaire :
  ├─ Calculer l'intersection entre :
  │   • Heures travaillées (clockIn → clockOut)
  │   • Période (startTime → endTime)
  │
  └─ Pour chaque plage de la période :
      ├─ Calculer l'intersection entre :
      │   • Intersection période
      │   • Plage horaire (startTime → endTime)
      │
      └─ Accumuler les heures selon le type :
          • NORMAL → breakdown.normal
          • OVERTIME → breakdown.overtime
          • NIGHT_SHIFT → breakdown.nightShift
          • SUNDAY → breakdown.sunday
          • HOLIDAY → breakdown.holiday
```

### Étape 3 : Application des Majorations

```typescript
// Si c'est un dimanche
if (isSunday(date)) {
  breakdown.sunday += breakdown.normal;
  breakdown.normal = 0;
}

// Si c'est un jour férié
if (isHoliday(date)) {
  breakdown.holiday += breakdown.normal;
  breakdown.normal = 0;
}
```

### Étape 4 : Vérification des Heures du Cycle

```typescript
// Calculer les heures accumulées sur la période (semaine/mois)
totalHoursThisPeriod = heures du jour + heures des jours précédents

// Si on dépasse le seuil du cycle
if (totalHoursThisPeriod > thresholdHours) {
  excess = totalHoursThisPeriod - thresholdHours
  breakdown.overtime += excess
  breakdown.normal = Math.max(0, breakdown.normal - excess)
}
```

---

## 📁 Fichiers Créés

### 1. `backend/src/utils/overtimeCalculator.ts`

**Fonctions principales** :

#### `calculateHoursWorked(timeEntry: TimeEntryData)`

Calcule la décomposition des heures travaillées.

**Paramètres** :
```typescript
{
  employeeId: number;
  clockInTime: Date;
  clockOutTime: Date;
  date: Date;
}
```

**Retourne** :
```typescript
{
  normalHours: number;
  overtimeHours: number;
  specialHours: number;
  breakdown: {
    normal: number;
    overtime: number;
    nightShift: number;
    sunday: number;
    holiday: number;
    other: number;
  };
  ranges: Array<{
    start: string;
    end: string;
    hours: number;
    type: string;
    multiplier: number;
  }>;
}
```

#### `autoCreateOvertimeAndSpecialHours(timeEntry, calculatedHours)`

Crée automatiquement les enregistrements d'heures sup/spéciales.

**Logique** :
- Si `overtimeHours > 0.25` → Crée un `Overtime` (PENDING)
- Si `specialHours > 0.25` → Crée un `SpecialHour` (PENDING)

---

## 🔧 Intégration dans le Contrôleur

### `timeEntry.controller.ts` - Fonction `clockOut`

```typescript
// Après l'enregistrement du pointage
const calculatedHours = await calculateHoursWorked({
  employeeId,
  clockInTime: timeEntry.clockIn,
  clockOutTime: now,
  date: today,
});

// Créer automatiquement les enregistrements
await autoCreateOvertimeAndSpecialHours(
  { employeeId, clockInTime, clockOutTime, date },
  calculatedHours
);

// Sauvegarder les détails dans TimeEntry
await prisma.timeEntry.update({
  where: { id: updatedEntry.id },
  data: {
    validationErrors: JSON.stringify({
      calculatedHours: {
        normal: calculatedHours.normalHours,
        overtime: calculatedHours.overtimeHours,
        special: calculatedHours.specialHours,
        breakdown: calculatedHours.breakdown,
      },
    }),
  },
});
```

---

## 📊 Exemple Concret

### Configuration

**Horaire "Bureau Standard"** :
- Début : 08:00
- Fin : 18:00

**Période "Matin"** (08:00-12:00) :
- Plage "Normale" (08:00-10:00) → x1.0
- Plage "Sup" (10:00-12:00) → x1.25

**Période "Après-midi"** (13:00-18:00) :
- Plage "Normale" (13:00-17:00) → x1.0
- Plage "Sup" (17:00-18:00) → x1.25

### Pointage

```
Jean pointe :
├─ Entrée : 08:00
└─ Sortie : 19:00
```

### Calcul Automatique

```
Décomposition :
├─ 08:00-10:00 → 2h NORMAL (x1.0) = 2h normales
├─ 10:00-12:00 → 2h OVERTIME (x1.25) = 2h sup
├─ 12:00-13:00 → 1h Pause (non comptée)
├─ 13:00-17:00 → 4h NORMAL (x1.0) = 4h normales
├─ 17:00-18:00 → 1h OVERTIME (x1.25) = 1h sup
└─ 18:00-19:00 → 1h Hors horaire (x1.5) = 1.5h sup

Total :
├─ Normales : 6h
├─ Sup : 4.5h
└─ Spéciales : 0h
```

### Résultat

1. ✅ **TimeEntry** mis à jour avec `totalHours: 10`
2. ✅ **Overtime** créé automatiquement :
   ```json
   {
     "employeeId": 1,
     "date": "2025-11-02",
     "hours": 4.5,
     "reason": "Calcul automatique basé sur l'horaire",
     "status": "PENDING"
   }
   ```
3. ✅ Détails sauvegardés dans `TimeEntry.validationErrors`

---

## 🎯 Cas Spéciaux

### Cas 1 : Pas d'horaire assigné

```
Si l'employé n'a pas de cycle de travail :
→ Toutes les heures sont normales
→ Aucun calcul automatique
```

### Cas 2 : Pointage hors horaire

```
Si pointage avant startTime ou après endTime :
→ Heures hors horaire = automatiquement sup (x1.5)
```

### Cas 3 : Dimanche

```
Si le pointage est un dimanche :
→ Toutes les heures normales deviennent des heures dimanche
→ Création d'un SpecialHour avec hourType = 'WEEKEND'
```

### Cas 4 : Dépassement du cycle

```
Si total heures du cycle > weeklyHours :
→ Excédent = heures supplémentaires
→ Calculé automatiquement sur la période complète
```

---

## 📋 Fonctions Utilitaires

### `timeToMinutes(timeStr: string)`

Convertit "HH:MM" en minutes depuis minuit.

```typescript
timeToMinutes("08:30") // → 510 minutes
```

### `minutesToHours(minutes: number)`

Convertit des minutes en heures décimales.

```typescript
minutesToHours(150) // → 2.5 heures
```

### `isSunday(date: Date)`

Vérifie si une date est un dimanche.

```typescript
isSunday(new Date("2025-11-02")) // → false (samedi)
```

### `isHoliday(date: Date)`

Vérifie si une date est un jour férié.

**⚠️ À implémenter** : Vérification depuis une table de jours fériés.

---

## 🔒 Gestion des Erreurs

Le calcul automatique **ne bloque pas** le pointage en cas d'erreur :

```typescript
try {
  const calculatedHours = await calculateHoursWorked(...);
  await autoCreateOvertimeAndSpecialHours(...);
} catch (calcError) {
  // Log l'erreur mais continue le pointage
  console.error('Erreur lors du calcul automatique:', calcError);
}
```

**Raisons possibles d'erreur** :
- Employé sans cycle de travail
- Horaire mal configuré
- Erreur de base de données

---

## 📊 Format de Sauvegarde

Les détails du calcul sont sauvegardés dans `TimeEntry.validationErrors` (JSON) :

```json
{
  "calculatedHours": {
    "normal": 6.0,
    "overtime": 4.5,
    "special": 0.0,
    "breakdown": {
      "normal": 6.0,
      "overtime": 4.5,
      "nightShift": 0.0,
      "sunday": 0.0,
      "holiday": 0.0,
      "other": 0.0
    }
  }
}
```

---

## 🚀 Utilisation

### Dans le Frontend

Le frontend peut récupérer les détails du calcul depuis le `TimeEntry` :

```typescript
const timeEntry = await timeEntriesAPI.getById(id);
const calculatedHours = JSON.parse(timeEntry.validationErrors || '{}').calculatedHours;

console.log(`Heures normales : ${calculatedHours.normal}h`);
console.log(`Heures sup : ${calculatedHours.overtime}h`);
console.log(`Heures spéciales : ${calculatedHours.special}h`);
```

---

## ✅ Avantages

1. ✅ **Automatisation complète** : Plus besoin de déclarer manuellement
2. ✅ **Précision** : Calcul basé sur les plages horaires exactes
3. ✅ **Flexibilité** : Supporte tous types de plages (nuit, dimanche, etc.)
4. ✅ **Traçabilité** : Détails sauvegardés dans TimeEntry
5. ✅ **Non-bloquant** : Erreur ne bloque pas le pointage

---

## 🔄 Améliorations Futures

- [ ] Implémenter la vérification des jours fériés depuis la base
- [ ] Calcul en temps réel lors du pointage (prévisualisation)
- [ ] Notifications automatiques si heures sup importantes
- [ ] Export des détails de calcul dans les rapports
- [ ] Interface de validation/approbation des heures calculées

---

## 📝 Notes Techniques

### Performance

Le calcul est effectué **après** le pointage pour ne pas ralentir l'opération. Si nécessaire, on peut :
- L'exécuter en arrière-plan (queue)
- Le calculer de manière asynchrone
- Le mettre en cache

### Précision

Le calcul utilise des **intersections de plages** pour une précision maximale. Chaque minute est catégorisée selon sa plage horaire.

---

**✨ Le système de calcul automatique est opérationnel !**

📅 Créé le : 2 novembre 2025  
🎯 Version : 1.0.0  
👨‍💻 Auteur : Assistant IA

