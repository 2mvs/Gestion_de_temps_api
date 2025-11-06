# 🚀 Guide de Démarrage Rapide - Backend GTA

## 📦 Installation en 5 minutes

### Étape 1 : Installer MySQL

**Windows - Option A : MySQL Installer**
```bash
# Téléchargez MySQL depuis https://dev.mysql.com/downloads/installer/
# Installez avec la configuration par défaut
# Notez bien le mot de passe root !
```

**Windows - Option B : XAMPP/WAMP (Plus Simple)**
- XAMPP : https://www.apachefriends.org/
- WAMP : https://www.wampserver.com/
- Ces deux incluent MySQL + PHPMyAdmin

**Créer la base de données :**
```sql
-- Se connecter à MySQL
mysql -u root -p

-- Créer la base de données
CREATE DATABASE gta_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Vérifier
SHOW DATABASES;
EXIT;
```

### Étape 2 : Configurer le projet

```bash
cd backend

# Installer les dépendances
npm install

# Copier le fichier .env.example
cp .env.example .env  # Linux/Mac
# Ou sur Windows : Copy-Item .env.example .env

# Modifier le fichier .env selon votre configuration :

# Pour XAMPP/WAMP (sans mot de passe) :
DATABASE_URL="mysql://root:@localhost:3306/gta_db"

# Ou pour MySQL standard (avec mot de passe) :
DATABASE_URL="mysql://root:votre_mot_de_passe@localhost:3306/gta_db"

# Le reste :
JWT_SECRET="votre_secret_super_securise_a_changer"
JWT_EXPIRES_IN="7d"
PORT=8008
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

### Étape 3 : Initialiser la base de données

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer les tables
npm run prisma:migrate

# Insérer des données de test
npm run prisma:seed
```

### Étape 4 : Démarrer le serveur

```bash
# Mode développement avec hot-reload
npm run dev

# Le serveur démarre sur http://localhost:8008
```

### Étape 5 : Tester l'API

**Avec curl :**
```bash
# Health check
curl http://localhost:8008/api/health

# Login
curl -X POST http://localhost:8008/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gta.com","password":"admin123"}'

# Récupérez le token et testez une route protégée
curl http://localhost:8008/api/employees \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

**Avec un client HTTP (Postman, Insomnia, Thunder Client) :**

1. **Login :**
   - Method: POST
   - URL: `http://localhost:8008/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "admin@gta.com",
       "password": "admin123"
     }
     ```
   - Récupérez le `token` dans la réponse

2. **Accéder aux employés :**
   - Method: GET
   - URL: `http://localhost:8008/api/employees`
   - Headers:
     ```
     Authorization: Bearer VOTRE_TOKEN
     ```

## 🎯 Données de test disponibles

Après le seed, vous aurez :

### Utilisateur Admin
- **Email :** admin@gta.com
- **Mot de passe :** admin123
- **Rôle :** ADMIN

### Unités Organisationnelles
- Direction Générale (DIR)
  - DSI - Direction des Systèmes d'Information
  - DRH - Direction des Ressources Humaines

### Employés
- EMP001 - Jean Dupont (DSI, 40h/semaine)
- EMP002 - Marie Martin (DRH, 35h/semaine)
- EMP003 - Pierre Bernard (DSI, 40h/semaine)

### Cycles de Travail
- Cycle standard 40h (STD40)
- Cycle 35h (STD35)

## 🔧 Commandes utiles

```bash
# Développement
npm run dev                # Démarrer en mode dev avec hot-reload

# Base de données
npm run prisma:studio      # Interface graphique pour la DB
npm run prisma:migrate     # Créer une nouvelle migration
npm run prisma:seed        # Réinsérer les données de test

# Production
npm run build              # Compiler TypeScript
npm start                  # Démarrer en mode production

# Prisma
npx prisma migrate reset   # ATTENTION: Réinitialise toute la DB
npx prisma db push         # Push le schema sans créer de migration
```

## 📍 URLs importantes

- **API Root:** http://localhost:8008
- **Documentation:** http://localhost:8008/
- **Health Check:** http://localhost:8008/api/health
- **Prisma Studio:** Lancez `npm run prisma:studio` puis http://localhost:5555

## 🐛 Résolution de problèmes courants

### Erreur : "Cannot connect to database"
```bash
# Vérifiez que MySQL est démarré
# Windows : Services > MySQL
# XAMPP : Panneau de contrôle XAMPP > MySQL > Start
# Ou testez la connexion :
mysql -u root -p

# Vérifiez votre DATABASE_URL dans le .env
```

### Erreur : "Module not found"
```bash
# Réinstallez les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Erreur : "Prisma Client not found"
```bash
# Régénérez le client Prisma
npm run prisma:generate
```

### Port 8008 déjà utilisé
```bash
# Modifiez le PORT dans le .env
PORT=8009

# Ou trouvez et tuez le processus :
# Windows :
netstat -ano | findstr :8008
taskkill /PID <PID> /F
```

## 📚 Prochaines étapes

1. Testez toutes les routes avec Postman/Insomnia
2. Consultez le fichier `README.md` pour la documentation complète
3. Explorez le schéma Prisma dans `prisma/schema.prisma`
4. Connectez le frontend sur http://localhost:3000

## 🆘 Besoin d'aide ?

- Consultez la documentation complète dans `README.md`
- Vérifiez les logs du serveur dans la console
- Utilisez Prisma Studio pour visualiser la base de données
- Consultez la documentation Prisma : https://www.prisma.io/docs

Bon développement ! 🎉

