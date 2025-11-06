import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getProfile } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';

const router = Router();

// Validation pour l'inscription
const registerValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
];

// Validation pour la connexion
const loginValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis'),
];

// Routes
router.post('/register', validate(registerValidation), register);
router.post('/login', validate(loginValidation), login);
router.get('/profile', authenticate, getProfile);

export default router;

