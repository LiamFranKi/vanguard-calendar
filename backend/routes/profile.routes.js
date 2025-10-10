import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validator.middleware.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { upload } from '../config/multer.js';
import * as profileController from '../controllers/profile.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Obtener mi perfil
router.get('/me', profileController.getMyProfile);

// Actualizar mi perfil
router.put(
  '/me',
  [
    body('nombres').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('apellidos').optional().notEmpty().withMessage('Los apellidos no pueden estar vacíos'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('clave').optional().isLength({ min: 6 }).withMessage('La clave debe tener al menos 6 caracteres'),
    validate
  ],
  profileController.updateMyProfile
);

// Actualizar avatar
router.post(
  '/avatar',
  upload.single('avatar'),
  profileController.updateAvatar
);

export default router;

