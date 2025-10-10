import express from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  assignUserToTask,
  removeUserFromTask,
  addComment,
  addReaction,
  addSubtask,
  updateSubtask,
  deleteSubtask,
  getAllProjects,
  createProject,
  getAllTemplates,
  createTaskFromTemplate,
  startTimeTracking,
  stopTimeTracking,
  getTaskAnalytics
} from '../controllers/tasks.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// ===== RUTAS DE TAREAS PRINCIPALES =====

// Obtener todas las tareas con filtros avanzados
router.get('/', verifyToken, getAllTasks);

// Obtener tarea específica con toda la información
router.get('/:id', verifyToken, getTaskById);

// Crear nueva tarea
router.post('/', verifyToken, createTask);

// Actualizar tarea
router.put('/:id', verifyToken, updateTask);

// Eliminar tarea
router.delete('/:id', verifyToken, deleteTask);

// ===== RUTAS DE ASIGNACIONES =====

// Asignar usuario a tarea
router.post('/:taskId/assign', verifyToken, assignUserToTask);

// Remover usuario de tarea
router.delete('/:taskId/assign/:userId', verifyToken, removeUserFromTask);

// ===== RUTAS DE COMENTARIOS =====

// Agregar comentario a tarea
router.post('/:taskId/comments', verifyToken, addComment);

// Agregar reacción a comentario
router.post('/comments/:commentId/reactions', verifyToken, addReaction);

// ===== RUTAS DE SUBTAREAS =====

// Agregar subtarea
router.post('/:taskId/subtasks', verifyToken, addSubtask);

// Actualizar subtarea
router.put('/subtasks/:subtaskId', verifyToken, updateSubtask);

// Eliminar subtarea
router.delete('/subtasks/:subtaskId', verifyToken, deleteSubtask);

// ===== RUTAS DE PROYECTOS =====

// Obtener todos los proyectos
router.get('/projects/all', verifyToken, getAllProjects);

// Crear nuevo proyecto
router.post('/projects', verifyToken, createProject);

// ===== RUTAS DE TEMPLATES =====

// Obtener todos los templates
router.get('/templates/all', verifyToken, getAllTemplates);

// Crear tarea desde template
router.post('/templates/:templateId/create-task', verifyToken, createTaskFromTemplate);

// ===== RUTAS DE TIME TRACKING =====

// Iniciar cronómetro
router.post('/:taskId/time-tracking/start', verifyToken, startTimeTracking);

// Detener cronómetro
router.put('/time-tracking/:timeEntryId/stop', verifyToken, stopTimeTracking);

// ===== RUTAS DE ANALYTICS =====

// Obtener analytics de tareas
router.get('/analytics/dashboard', verifyToken, getTaskAnalytics);

export default router;
