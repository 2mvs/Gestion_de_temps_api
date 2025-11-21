// Handler serverless pour Vercel
// Ce fichier sert de point d'entrée pour les fonctions serverless de Vercel

// Charger les variables d'environnement
require('dotenv').config();

// Import de l'application Express compilée
// L'app est exportée par défaut dans app.ts
const appModule = require('../dist/app.js');

// Récupérer l'application Express
const app = appModule.default || appModule;

// Export pour Vercel (format serverless)
module.exports = app;
