═══════════════════════════════════════════════════════════════
  CRÉATION DU FICHIER .env - GUIDE SIMPLE
═══════════════════════════════════════════════════════════════

🎯 MÉTHODE AUTOMATIQUE (RECOMMANDÉE)
───────────────────────────────────────────────────────────────

1. Double-cliquez sur le fichier : creer-env.bat
2. Suivez les instructions à l'écran
3. C'est tout ! Le fichier .env sera créé automatiquement


📝 MÉTHODE MANUELLE
───────────────────────────────────────────────────────────────

1. Ouvrez le fichier : CONTENU_FICHIER_ENV.txt
2. Copiez TOUT le contenu entre les lignes "DÉBUT" et "FIN"
3. Créez un nouveau fichier nommé ".env" dans backend/
4. Collez le contenu copié
5. Modifiez la ligne DATABASE_URL selon votre config :

   Pour XAMPP/WAMP :
   DATABASE_URL="mysql://root:@localhost:3306/gta_db"

   Pour MySQL avec mot de passe :
   DATABASE_URL="mysql://root:VOTRE_PASSWORD@localhost:3306/gta_db"

6. Sauvegardez le fichier


✅ VÉRIFICATION
───────────────────────────────────────────────────────────────

Votre fichier .env doit contenir ces 6 lignes minimum :

DATABASE_URL="mysql://..."
JWT_SECRET="..."
JWT_EXPIRES_IN="7d"
PORT=8008
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"


🚀 APRÈS AVOIR CRÉÉ LE .env
───────────────────────────────────────────────────────────────

Ouvrez un terminal dans le dossier backend/ et exécutez :

npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev

Si tout fonctionne, vous verrez :
✅ Connexion à la base de données réussie
🚀 Serveur démarré sur le port 8008


📚 DOCUMENTATION COMPLÈTE
───────────────────────────────────────────────────────────────

→ SETUP_MYSQL.md         Guide complet MySQL
→ INSTRUCTIONS_ENV.md    Instructions détaillées .env
→ CONTENU_FICHIER_ENV.txt   Contenu exact à copier
→ creer-env.bat          Script automatique Windows

═══════════════════════════════════════════════════════════════

