import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validator.middleware.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { upload } from '../config/multer.js';
import * as configController from '../controllers/config.controller.js';

const router = express.Router();

// Obtener configuraciones (público - necesario para login/landing)
router.get('/', configController.getAllSettings);

// Las siguientes rutas requieren autenticación de admin
router.use(verifyToken);
router.use(requireRole('administrador'));

// Actualizar configuración general
router.put(
  '/',
  [
    body('nombre_proyecto').optional().notEmpty(),
    body('color_primario').optional().matches(/^#[0-9A-F]{6}$/i),
    body('color_secundario').optional().matches(/^#[0-9A-F]{6}$/i),
    validate
  ],
  configController.updateSettings
);

// Subir logo
router.post(
  '/upload/logo',
  upload.single('logo'),
  configController.uploadLogo
);

// Subir favicon
router.post(
  '/upload/favicon',
  upload.single('favicon'),
  configController.uploadFavicon
);

export default router;

