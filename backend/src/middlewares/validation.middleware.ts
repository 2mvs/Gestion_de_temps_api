import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Exécuter toutes les validations
    for (const validation of validations) {
      await validation.run(req);
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
      return;
    }

    res.status(400).json({
      message: 'Erreur de validation',
      errors: errors.array().map((error: any) => ({
        field: error.path || error.param,
        message: error.msg,
      })),
    });
  };
};

