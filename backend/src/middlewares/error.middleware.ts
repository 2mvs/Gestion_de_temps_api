import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Erreur:', err);

  // Erreurs Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Contrainte unique violée
    if (err.code === 'P2002') {
      res.status(409).json({
        message: 'Cette valeur existe déjà',
        field: (err.meta?.target as string[])?.join(', '),
      });
      return;
    }

    // P2025: Enregistrement non trouvé
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'Ressource non trouvée' });
      return;
    }

    // P2003: Contrainte de clé étrangère violée
    if (err.code === 'P2003') {
      res.status(400).json({ message: 'Référence invalide' });
      return;
    }
  }

  // Erreurs de validation Prisma
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ message: 'Données invalides', error: err.message });
    return;
  }

  // Erreurs personnalisées
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur interne du serveur';

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({ message: `Route ${req.originalUrl} non trouvée` });
};

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

