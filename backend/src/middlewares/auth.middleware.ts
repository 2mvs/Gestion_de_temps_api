import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

// Étendre l'interface Request pour inclure user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Token d\'authentification manquant' });
      return;
    }

    const token = authHeader.substring(7); // Enlever "Bearer "
    const decoded = verifyToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Non authentifié' });
      return;
    }

    if (roles.length && !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Accès refusé' });
      return;
    }

    next();
  };
};

