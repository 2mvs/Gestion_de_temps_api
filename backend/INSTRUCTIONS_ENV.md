# 📝 Instructions pour Créer le Fichier .env

## 🎯 Méthode Rapide

### 1. Créer le fichier .env

Dans le dossier `backend/`, créez un nouveau fichier nommé exactement `.env` (avec le point au début)

### 2. Copier le contenu ci-dessous

Copiez **TOUT** le contenu ci-dessous dans votre fichier `.env` :

```env
# ============================================
# BASE DE DONNÉES MYSQL
# ============================================
# Choisissez LA LIGNE qui correspond à votre installation :

# Si vous utilisez XAMPP (décommentez cette ligne) :
DATABASE_URL="mysql://root:@localhost:3306/gta_db"

# Si vous utilisez WAMP (décommentez cette ligne) :
# DATABASE_URL="mysql://root:@localhost:3306/gta_db"

# Si vous avez MySQL avec un mot de passe (décommentez et modifiez) :
# DATABASE_URL="mysql://root:VOTRE_MOT_DE_PASSE@localhost:3306/gta_db"

# ============================================
# SÉCURITÉ JWT
# ============================================
JWT_SECRET="secret_jwt_dev_2025_gta_change_in_production_abc123xyz789"
JWT_EXPIRES_IN="7d"

# ============================================
# CONFIGURATION SERVEUR
# ============================================
PORT=8008
NODE_ENV="development"

# ============================================
# CORS
# ============================================
CORS_ORIGIN="http://localhost:3000"
```

### 3. Adapter selon votre configuration

**IMPORTANT :** Décommentez (enlevez le #) SEULEMENT la ligne `DATABASE_URL` qui correspond à votre installation :

#### ✅ Pour XAMPP (pas de mot de passe) :
```env
DATABASE_URL="mysql://root:@localhost:3306/gta_db"
```

#### ✅ Pour WAMP (pas de mot de passe) :
```env
DATABASE_URL="mysql://root:@localhost:3306/gta_db"
```

#### ✅ Pour MySQL avec mot de passe :
```env
DATABASE_URL="mysql://root:votre_mot_de_passe_ici@localhost:3306/gta_db"
```
⚠️ Remplacez `votre_mot_de_passe_ici` par votre vrai mot de passe MySQL !

---

## 📋 Méthode Alternative (Copier-Coller)

Vous pouvez aussi copier le fichier `.env.COPIER_CECI` :

**Windows (PowerShell) :**
```powershell
cd backend
Copy-Item .env.COPIER_CECI .env
```

**Windows (CMD) :**
```cmd
cd backend
copy .env.COPIER_CECI .env
```

Puis modifiez le fichier `.env` avec votre éditeur.

---

## ✅ Vérification

Votre fichier `.env` final doit ressembler à ceci :

### Exemple pour XAMPP :
```env
DATABASE_URL="mysql://root:@localhost:3306/gta_db"
JWT_SECRET="secret_jwt_dev_2025_gta_change_in_production_abc123xyz789"
JWT_EXPIRES_IN="7d"
PORT=8008
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

### Exemple pour MySQL avec mot de passe :
```env
DATABASE_URL="mysql://root:monmotdepasse@localhost:3306/gta_db"
JWT_SECRET="secret_jwt_dev_2025_gta_change_in_production_abc123xyz789"
JWT_EXPIRES_IN="7d"
PORT=8008
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

---

## 🚀 Prochaines Étapes

Une fois le fichier `.env` créé :

```bash
cd backend

# 1. Générer le client Prisma
npm run prisma:generate

# 2. Créer les tables dans MySQL
npm run prisma:migrate

# 3. Insérer les données de test
npm run prisma:seed

# 4. Démarrer le serveur
npm run dev
```

Si tout fonctionne, vous verrez :
```
✅ Connexion à la base de données réussie
🚀 Serveur démarré sur le port 8008
```

---

## 🐛 Problèmes Courants

### ❌ "Access denied for user 'root'"
→ Vérifiez votre mot de passe dans `DATABASE_URL`
→ Pour XAMPP/WAMP, utilisez : `mysql://root:@localhost:3306/gta_db` (sans mot de passe)

### ❌ "Unknown database 'gta_db'"
→ Créez la base de données :
```sql
mysql -u root -p
CREATE DATABASE gta_db;
EXIT;
```

### ❌ "Can't connect to MySQL server"
→ Démarrez MySQL (XAMPP Control Panel ou Services Windows)

---

## 📞 Besoin d'Aide ?

Consultez le guide complet : `backend/SETUP_MYSQL.md`

