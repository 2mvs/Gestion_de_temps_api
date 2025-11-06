# 🐬 Configuration MySQL pour le Backend GTA

## 📋 Étape 1 : Installer MySQL

### Windows

**Option A : MySQL Installer (Recommandé)**
1. Téléchargez MySQL Installer : https://dev.mysql.com/downloads/installer/
2. Choisissez "MySQL Installer for Windows"
3. Installez avec la configuration par défaut
4. Notez bien le mot de passe root que vous définissez !

**Option B : XAMPP/WAMP**
- **XAMPP** : https://www.apachefriends.org/
- **WAMP** : https://www.wampserver.com/

Ces deux options incluent MySQL, Apache et PHPMyAdmin.

### Vérifier l'Installation

```bash
# Vérifier que MySQL est installé
mysql --version

# Se connecter à MySQL
mysql -u root -p
# Entrez votre mot de passe root
```

## 🗄️ Étape 2 : Créer la Base de Données

### Option A : Ligne de Commande

```bash
# Se connecter à MySQL
mysql -u root -p

# Dans MySQL, exécutez :
CREATE DATABASE gta_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Vérifier que la base est créée
SHOW DATABASES;

# Sortir de MySQL
EXIT;
```

### Option B : PHPMyAdmin

Si vous utilisez XAMPP/WAMP :
1. Ouvrez http://localhost/phpmyadmin
2. Cliquez sur "Nouvelle base de données"
3. Nom : `gta_db`
4. Interclassement : `utf8mb4_unicode_ci`
5. Cliquez sur "Créer"

### Option C : MySQL Workbench

1. Ouvrez MySQL Workbench
2. Connectez-vous à votre serveur local
3. Cliquez sur l'icône "Create a new schema"
4. Nom : `gta_db`
5. Charset : `utf8mb4`
6. Cliquez sur "Apply"

## ⚙️ Étape 3 : Configurer le Fichier .env

### 1. Copier le fichier exemple

```bash
cd backend
cp .env.example .env
```

**Ou sur Windows (PowerShell) :**
```powershell
cd backend
Copy-Item .env.example .env
```

**Ou manuellement :**
- Dupliquez le fichier `.env.example`
- Renommez la copie en `.env`

### 2. Modifier le .env selon votre configuration

Ouvrez `backend/.env` et modifiez la ligne `DATABASE_URL` :

#### Configuration XAMPP (Windows)
```env
DATABASE_URL="mysql://root:@localhost:3306/gta_db"
```
*Note : Pas de mot de passe par défaut sur XAMPP*

#### Configuration WAMP (Windows)
```env
DATABASE_URL="mysql://root:@localhost:3306/gta_db"
```
*Note : Pas de mot de passe par défaut sur WAMP*

#### Configuration MySQL Standard (avec mot de passe)
```env
DATABASE_URL="mysql://root:votre_mot_de_passe@localhost:3306/gta_db"
```
*Remplacez `votre_mot_de_passe` par votre vrai mot de passe root*

#### Configuration avec utilisateur personnalisé
```env
DATABASE_URL="mysql://gta_user:gta_password@localhost:3306/gta_db"
```

### 3. Fichier .env complet

Votre fichier `backend/.env` doit ressembler à ceci :

```env
# Base de données MySQL
DATABASE_URL="mysql://root:votre_mot_de_passe@localhost:3306/gta_db"

# JWT Secret
JWT_SECRET="secret_jwt_dev_2025_gta_change_in_production"
JWT_EXPIRES_IN="7d"

# Configuration serveur
PORT=8008
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:3000"
```

## 🚀 Étape 4 : Initialiser la Base de Données

```bash
cd backend

# Installer les dépendances si ce n'est pas déjà fait
npm install

# Générer le client Prisma
npm run prisma:generate

# Créer les tables dans MySQL
npm run prisma:migrate

# Insérer les données de test
npm run prisma:seed
```

## ✅ Étape 5 : Vérifier l'Installation

### Vérifier les tables créées

**Via MySQL Workbench ou PHPMyAdmin :**
- Ouvrez la base `gta_db`
- Vous devriez voir toutes les tables créées

**Via ligne de commande :**
```bash
mysql -u root -p

USE gta_db;
SHOW TABLES;

# Vous devriez voir :
# +-------------------------+
# | Tables_in_gta_db        |
# +-------------------------+
# | absences                |
# | audit_logs              |
# | employees               |
# | notifications           |
# | organizational_units    |
# | overtimes               |
# | schedules               |
# | special_hours           |
# | time_entries            |
# | users                   |
# | work_cycles             |
# | _prisma_migrations      |
# +-------------------------+

EXIT;
```

### Démarrer le serveur

```bash
npm run dev
```

Si tout fonctionne, vous verrez :
```
✅ Connexion à la base de données réussie
🚀 Serveur démarré sur le port 8008
```

### Tester l'API

**Dans votre navigateur :**
```
http://localhost:8008/api/health
```

**Avec curl :**
```bash
curl http://localhost:8008/api/health
```

**Réponse attendue :**
```json
{
  "status": "OK",
  "timestamp": "...",
  "uptime": 123.456,
  "environment": "development"
}
```

## 🐛 Résolution de Problèmes

### Erreur : "Client does not support authentication protocol"

**Problème :** MySQL 8+ utilise un nouveau plugin d'authentification.

**Solution :**
```sql
-- Connectez-vous à MySQL
mysql -u root -p

-- Exécutez cette commande
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'votre_mot_de_passe';
FLUSH PRIVILEGES;
EXIT;
```

### Erreur : "Access denied for user 'root'@'localhost'"

**Solutions :**
1. Vérifiez votre mot de passe dans le `.env`
2. Vérifiez que MySQL est démarré
3. Essayez sans mot de passe (XAMPP/WAMP) :
   ```env
   DATABASE_URL="mysql://root:@localhost:3306/gta_db"
   ```

### Erreur : "Unknown database 'gta_db'"

**Solution :**
La base de données n'a pas été créée. Créez-la :
```sql
mysql -u root -p
CREATE DATABASE gta_db;
EXIT;
```

### Erreur : "Can't connect to MySQL server on 'localhost'"

**Solutions :**
1. Vérifiez que MySQL est démarré
   - **Windows Services** : Cherchez "MySQL" et démarrez le service
   - **XAMPP** : Démarrez MySQL dans le panneau XAMPP
   - **WAMP** : Démarrez tous les services

2. Vérifiez le port (par défaut 3306)
3. Si vous utilisez un autre port, modifiez dans le `.env`

### Erreur : "P1001: Can't reach database server"

**Solution :**
MySQL n'est pas démarré. Démarrez-le via :
- **Windows Services** → MySQL → Démarrer
- **XAMPP Control Panel** → MySQL → Start
- **WAMP** → Démarrer tous les services

## 📊 Outils Utiles

### 1. MySQL Workbench
- Interface graphique officielle
- Téléchargement : https://dev.mysql.com/downloads/workbench/

### 2. PHPMyAdmin
- Interface web (incluse avec XAMPP/WAMP)
- URL : http://localhost/phpmyadmin

### 3. Prisma Studio
- Interface Prisma pour visualiser vos données
```bash
cd backend
npm run prisma:studio
```
- Ouvre automatiquement http://localhost:5555

### 4. DBeaver
- Client universel gratuit
- Téléchargement : https://dbeaver.io/

## 🔐 Créer un Utilisateur Dédié (Recommandé pour Production)

```sql
-- Se connecter en root
mysql -u root -p

-- Créer un utilisateur dédié
CREATE USER 'gta_user'@'localhost' IDENTIFIED BY 'gta_secure_password';

-- Donner tous les droits sur la base gta_db
GRANT ALL PRIVILEGES ON gta_db.* TO 'gta_user'@'localhost';

-- Appliquer les changements
FLUSH PRIVILEGES;

EXIT;
```

Puis modifiez votre `.env` :
```env
DATABASE_URL="mysql://gta_user:gta_secure_password@localhost:3306/gta_db"
```

## 📝 Configurations Courantes

### XAMPP (Windows)
```env
DATABASE_URL="mysql://root:@localhost:3306/gta_db"
```

### WAMP (Windows)
```env
DATABASE_URL="mysql://root:@localhost:3306/gta_db"
```

### MySQL Standard (Windows/Linux/Mac)
```env
DATABASE_URL="mysql://root:votre_mot_de_passe@localhost:3306/gta_db"
```

### MySQL avec Port Personnalisé
```env
DATABASE_URL="mysql://root:password@localhost:3307/gta_db"
```

### MySQL Distant
```env
DATABASE_URL="mysql://user:password@192.168.1.100:3306/gta_db"
```

## ✅ Checklist Finale

- [ ] MySQL installé et démarré
- [ ] Base de données `gta_db` créée
- [ ] Fichier `.env` créé et configuré
- [ ] `npm install` exécuté
- [ ] `npm run prisma:generate` exécuté
- [ ] `npm run prisma:migrate` exécuté sans erreurs
- [ ] `npm run prisma:seed` exécuté avec succès
- [ ] `npm run dev` démarre sans erreurs
- [ ] http://localhost:8008/api/health répond OK
- [ ] Connexion frontend fonctionne

## 🎉 Terminé !

Votre backend est maintenant configuré avec MySQL ! 🐬

Pour démarrer :
```bash
cd backend
npm run dev
```

Pour voir les données dans Prisma Studio :
```bash
npm run prisma:studio
```

**Prochaines étapes :**
1. Testez le login avec `admin@gta.com` / `admin123`
2. Explorez l'API avec Postman/Insomnia
3. Connectez le frontend sur http://localhost:3000

📚 **Documentation complète :** Consultez `backend/README.md`

