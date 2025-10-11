import express from 'express';
import {
  getGeneralStats,
  getTasksReport,
  getEventsReport,
  getUserProductivity,
  getActivityTimeline,
  exportToCSV,
  exportToExcel
} from '../controllers/reports.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// ===== RUTAS DE REPORTES =====

// Obtener estadísticas generales
router.get('/stats', getGeneralStats);

// Obtener reporte detallado de tareas
router.get('/tasks', getTasksReport);

// Obtener reporte detallado de eventos
router.get('/events', getEventsReport);

// Obtener productividad por usuario
router.get('/productivity', getUserProductivity);

// Obtener timeline de actividad
router.get('/timeline', getActivityTimeline);

// Exportar a CSV
router.get('/export/csv', exportToCSV);

// Exportar a Excel (profesional)
router.get('/export/excel', exportToExcel);

export default router;

