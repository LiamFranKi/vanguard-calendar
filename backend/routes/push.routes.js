import express from 'express';
import * as pushController from '../controllers/push.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Obtener clave pública VAPID
router.get('/vapid-public-key', pushController.getVapidPublicKey);

// Suscribirse a push notifications
router.post('/subscribe', pushController.subscribe);

// Desuscribirse de push notifications
router.post('/unsubscribe', pushController.unsubscribe);

// Obtener suscripciones del usuario
router.get('/subscriptions', pushController.getUserSubscriptions);

// Enviar notificación de prueba
router.post('/test', pushController.sendTestPush);

export default router;

