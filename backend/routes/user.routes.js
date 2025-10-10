import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validator.middleware.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { upload } from '../config/multer.js';
import * as userController from '../controllers/user.controller.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Listar todos los usuarios (solo admin)
router.get('/', requireRole('administrador'), userController.getAllUsers);

// Obtener usuario por ID
router.get('/:id', userController.getUserById);

// Crear nuevo usuario (solo admin)
router.post(
  '/',
  requireRole('administrador'),
  upload.single('avatar'),
  [
    body('dni').notEmpty().withMessage('El DNI es requerido').isLength({ min: 8, max: 8 }).withMessage('El DNI debe tener 8 dígitos'),
    body('nombres').notEmpty().withMessage('El nombre es requerido'),
    body('apellidos').notEmpty().withMessage('Los apellidos son requeridos'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('clave').isLength({ min: 6 }).withMessage('La clave debe tener al menos 6 caracteres'),
    body('rol').notEmpty().withMessage('El rol es requerido').isIn(['administrador', 'docente', 'estudiante']).withMessage('Rol inválido'),
    validate
  ],
  userController.createUser
);

// Actualizar usuario (solo admin)
router.put(
  '/:id',
  requireRole('administrador'),
  upload.single('avatar'),
  [
    body('dni').optional().isLength({ min: 8, max: 8 }).withMessage('El DNI debe tener 8 dígitos'),
    body('nombres').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('apellidos').optional().notEmpty().withMessage('Los apellidos no pueden estar vacíos'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('clave').optional().isLength({ min: 6 }).withMessage('La clave debe tener al menos 6 caracteres'),
    body('rol').optional().isIn(['administrador', 'docente', 'estudiante']).withMessage('Rol inválido'),
    validate
  ],
  userController.updateUser
);

// Eliminar usuario (solo admin)
router.delete('/:id', requireRole('administrador'), userController.deleteUser);

// Cambiar estado activo/inactivo (solo admin)
router.patch('/:id/toggle-status', requireRole('administrador'), userController.toggleUserStatus);

export default router;

