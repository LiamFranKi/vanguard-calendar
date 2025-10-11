import express from 'express';
import {
  getCalendarEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventById
} from '../controllers/calendar.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// ===== RUTAS DE CALENDARIO =====

// Obtener eventos del calendario (tareas + eventos)
router.get('/events', verifyToken, getCalendarEvents);

// Obtener evento específico por ID
router.get('/events/:id', verifyToken, getEventById);

// Crear nuevo evento
router.post('/events', verifyToken, createEvent);

// Actualizar evento
router.put('/events/:id', verifyToken, updateEvent);

// Eliminar evento
router.delete('/events/:id', verifyToken, deleteEvent);

export default router;

