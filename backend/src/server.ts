import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import prisma from './config/database';

const PORT = process.env.PORT || 8008;

// Fonction de démarrage du serveur
const startServer = async () => {
  try {
    // Test de connexion à la base de données
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');

    // Démarrage du serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API disponible sur: http://localhost:${PORT}/api`);
      console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

// Gestion de l'arrêt gracieux
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await prisma.$disconnect();
  console.log('✅ Déconnexion de la base de données');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await prisma.$disconnect();
  console.log('✅ Déconnexion de la base de données');
  process.exit(0);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error);
  process.exit(1);
});

// Démarrer le serveur
startServer();

