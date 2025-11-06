@echo off
chcp 65001 >nul
echo.
echo ════════════════════════════════════════════════════════════════
echo   CRÉATION DU FICHIER .env POUR BACKEND GTA
echo ════════════════════════════════════════════════════════════════
echo.
echo Ce script va créer votre fichier .env automatiquement
echo.

:menu
echo Quelle est votre configuration MySQL ?
echo.
echo [1] XAMPP (sans mot de passe)
echo [2] WAMP (sans mot de passe)
echo [3] MySQL avec mot de passe
echo [4] Annuler
echo.
set /p choix="Votre choix (1-4) : "

if "%choix%"=="1" goto xampp
if "%choix%"=="2" goto wamp
if "%choix%"=="3" goto mysql_password
if "%choix%"=="4" goto fin
echo Choix invalide !
goto menu

:xampp
set "db_url=mysql://root:@localhost:3306/gta_db"
goto create_file

:wamp
set "db_url=mysql://root:@localhost:3306/gta_db"
goto create_file

:mysql_password
echo.
set /p password="Entrez votre mot de passe MySQL root : "
set "db_url=mysql://root:%password%@localhost:3306/gta_db"
goto create_file

:create_file
echo.
echo Création du fichier .env...
(
echo # ============================================
echo # BASE DE DONNÉES MYSQL
echo # ============================================
echo DATABASE_URL="%db_url%"
echo.
echo # ============================================
echo # SÉCURITÉ JWT
echo # ============================================
echo JWT_SECRET="secret_jwt_dev_2025_gta_change_in_production"
echo JWT_EXPIRES_IN="7d"
echo.
echo # ============================================
echo # CONFIGURATION SERVEUR
echo # ============================================
echo PORT=8008
echo NODE_ENV="development"
echo.
echo # ============================================
echo # CORS
echo # ============================================
echo CORS_ORIGIN="http://localhost:3000"
) > .env

echo.
echo ✅ Fichier .env créé avec succès !
echo.
echo Configuration utilisée :
echo DATABASE_URL=%db_url%
echo.
echo.
echo 📋 Prochaines étapes :
echo.
echo 1. Vérifiez que MySQL est démarré
echo 2. Créez la base de données (si pas déjà fait) :
echo    mysql -u root -p
echo    CREATE DATABASE gta_db;
echo    EXIT;
echo.
echo 3. Exécutez les commandes suivantes :
echo    npm install
echo    npm run prisma:generate
echo    npm run prisma:migrate
echo    npm run prisma:seed
echo    npm run dev
echo.
pause
goto fin

:fin
echo.
echo Script terminé.
echo.
pause

