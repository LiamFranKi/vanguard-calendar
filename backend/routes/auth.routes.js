import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validator.middleware.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

// Registro de usuario
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('role').optional().isIn(['estudiante', 'docente', 'administrativo']).withMessage('Rol inválido'),
    validate
  ],
  authController.register
);

// Login
router.post(
  '/login',
  [
    body('dni').notEmpty().withMessage('El DNI es requerido'),
    body('clave').notEmpty().withMessage('La clave es requerida'),
    validate
  ],
  authController.login
);

// Obtener usuario actual
router.get('/me', verifyToken, authController.getMe);

// Logout (invalidar token si usas blacklist)
router.post('/logout', verifyToken, authController.logout);

// Cambiar contraseña
router.put(
  '/change-password',
  verifyToken,
  [
    body('currentPassword').notEmpty().withMessage('La contraseña actual es requerida'),
    body('newPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
    validate
  ],
  authController.changePassword
);

export default router;


