import express from 'express';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notifications.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Obtener notificaciones del usuario
router.get('/', verifyToken, getUserNotifications);

// Marcar notificación como leída
router.put('/:id/read', verifyToken, markAsRead);

// Marcar todas como leídas
router.put('/read-all', verifyToken, markAllAsRead);

// Eliminar notificación
router.delete('/:id', verifyToken, deleteNotification);

export default router;
