# 🔐 Configuration des Variables d'Environnement

## Création du fichier .env

Créez un fichier `.env` à la racine du dossier `backend/` avec le contenu suivant :

```env
# ============================================
# BASE DE DONNÉES
# ============================================
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
# Exemple local: postgresql://postgres:password@localhost:5432/gta_db?schema=public
DATABASE_URL="postgresql://user:password@localhost:5432/gta_db?schema=public"

# ============================================
# SÉCURITÉ JWT
# ============================================
# Secret utilisé pour signer les tokens JWT
# IMPORTANT: Changez cette valeur en production !
# Générez une clé sécurisée avec: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET="votre_secret_jwt_très_sécurisé_changez_moi_en_production_abc123xyz789"

# Durée de validité des tokens JWT
# Exemples: "7d" (7 jours), "24h" (24 heures), "30m" (30 minutes)
JWT_EXPIRES_IN="7d"

# ============================================
# CONFIGURATION SERVEUR
# ============================================
# Port sur lequel le serveur écoute
PORT=8008

# Environnement d'exécution
# Options: "development", "production", "test"
NODE_ENV="development"

# ============================================
# CORS (Cross-Origin Resource Sharing)
# ============================================
# URL du frontend autorisé à accéder à l'API
# En développement: http://localhost:3000
# En production: https://votre-domaine.com
CORS_ORIGIN="http://localhost:3000"
```

## 📝 Détails des Variables

### DATABASE_URL
**Description :** URL de connexion à PostgreSQL  
**Format :** `postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?schema=[SCHEMA]`  
**Exemple :**
- Local: `postgresql://postgres:mypassword@localhost:5432/gta_db?schema=public`
- Production: `postgresql://prod_user:prod_pass@db.example.com:5432/gta_prod?schema=public`

**Paramètres :**
- `USER` : Nom d'utilisateur PostgreSQL
- `PASSWORD` : Mot de passe
- `HOST` : Adresse du serveur (localhost ou IP)
- `PORT` : Port PostgreSQL (par défaut 5432)
- `DATABASE` : Nom de la base de données
- `SCHEMA` : Schéma PostgreSQL (généralement "public")

### JWT_SECRET
**Description :** Clé secrète pour signer les tokens JWT  
**Sécurité :** ⚠️ **CRITIQUE** - Ne partagez JAMAIS cette clé  
**Génération :** Utilisez une valeur aléatoire et complexe

**Pour générer une clé sécurisée :**
```bash
# Avec Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Avec OpenSSL
openssl rand -hex 64

# En ligne
https://www.random.org/strings/
```

### JWT_EXPIRES_IN
**Description :** Durée de validité des tokens JWT  
**Format :** Nombre + unité (s, m, h, d)  
**Exemples :**
- `"30m"` → 30 minutes
- `"2h"` → 2 heures
- `"7d"` → 7 jours
- `"30d"` → 30 jours

**Recommandations :**
- Développement : `"7d"` ou `"30d"`
- Production : `"24h"` ou `"7d"` selon les besoins de sécurité

### PORT
**Description :** Port d'écoute du serveur  
**Par défaut :** `8008`  
**Alternatives :** N'importe quel port disponible (3000, 3001, 5000, 8000, etc.)

### NODE_ENV
**Description :** Environnement d'exécution  
**Valeurs possibles :**
- `"development"` : Mode développement (logs verbeux, hot-reload)
- `"production"` : Mode production (optimisé, logs minimaux)
- `"test"` : Mode test (pour les tests automatisés)

**Impact :**
- Affecte le niveau de logging
- Modifie certains comportements de sécurité
- Optimise les performances en production

### CORS_ORIGIN
**Description :** URL autorisée à accéder à l'API  
**Sécurité :** Protège contre les accès non autorisés  
**Exemples :**
- Développement : `"http://localhost:3000"`
- Production : `"https://monapp.com"`
- Plusieurs origines : Nécessite modification du code

## 🎯 Configuration par Environnement

### Développement Local
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gta_dev?schema=public"
JWT_SECRET="dev_secret_key_not_for_production_12345"
JWT_EXPIRES_IN="30d"
PORT=8008
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

### Staging / Pré-production
```env
DATABASE_URL="postgresql://staging_user:staging_pass@staging-db.example.com:5432/gta_staging?schema=public"
JWT_SECRET="[GÉNÉRER UNE CLÉ UNIQUE ET SÉCURISÉE]"
JWT_EXPIRES_IN="7d"
PORT=8008
NODE_ENV="production"
CORS_ORIGIN="https://staging.example.com"
```

### Production
```env
DATABASE_URL="postgresql://prod_user:prod_pass@prod-db.example.com:5432/gta_prod?schema=public"
JWT_SECRET="[GÉNÉRER UNE CLÉ UNIQUE ET SÉCURISÉE]"
JWT_EXPIRES_IN="24h"
PORT=8008
NODE_ENV="production"
CORS_ORIGIN="https://app.example.com"
```

## ⚠️ Sécurité - Bonnes Pratiques

### ✅ À FAIRE

1. **Ne jamais commiter le fichier .env**
   - Le fichier est déjà dans `.gitignore`
   - Vérifiez avant chaque commit

2. **Utiliser des secrets différents par environnement**
   - Dev ≠ Staging ≠ Production

3. **Générer des JWT_SECRET complexes**
   - Au moins 32 caractères
   - Combinaison de lettres, chiffres, symboles

4. **Limiter la durée des tokens en production**
   - Préférez 24h ou 7d max
   - Balance entre sécurité et UX

5. **Utiliser des gestionnaires de secrets en production**
   - AWS Secrets Manager
   - Azure Key Vault
   - HashiCorp Vault
   - Variables d'environnement du serveur

### ❌ À ÉVITER

1. ❌ Commiter le fichier .env dans Git
2. ❌ Partager vos secrets par email/Slack
3. ❌ Utiliser des secrets simples ("secret", "password123")
4. ❌ Réutiliser le même JWT_SECRET entre environnements
5. ❌ Mettre des secrets dans le code source

## 🔍 Vérification de la Configuration

**Test de connexion à la base de données :**
```bash
# Avec psql
psql "postgresql://user:password@localhost:5432/gta_db"

# Ou en SQL
psql -h localhost -U user -d gta_db
```

**Test du serveur :**
```bash
# Démarrer le serveur
npm run dev

# Vérifier le health check
curl http://localhost:8008/api/health

# Devrait retourner:
# {"status":"OK","timestamp":"...","uptime":...}
```

## 📞 Support

Si vous rencontrez des problèmes de configuration :

1. Vérifiez que PostgreSQL est bien démarré
2. Testez la connexion à la base manuellement
3. Vérifiez que le port n'est pas déjà utilisé
4. Consultez les logs du serveur pour les erreurs
5. Assurez-vous que le fichier .env est bien à la racine de `backend/`

## 📚 Ressources

- [Documentation Prisma - Connection URLs](https://www.prisma.io/docs/reference/database-reference/connection-urls)
- [Documentation JWT](https://jwt.io/introduction)
- [Best Practices Environment Variables](https://12factor.net/config)

