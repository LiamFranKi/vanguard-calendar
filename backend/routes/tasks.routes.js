import express from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getAllProjects,
  createProject,
  addComment,
  getComments,
  deleteComment
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

// ===== RUTAS DE PROYECTOS =====

// Obtener todos los proyectos
router.get('/projects/all', verifyToken, getAllProjects);

// Crear nuevo proyecto
router.post('/projects', verifyToken, createProject);

// ===== RUTAS DE COMENTARIOS =====

// Obtener comentarios de una tarea
router.get('/:taskId/comments', verifyToken, getComments);

// Agregar comentario a una tarea
router.post('/:taskId/comments', verifyToken, addComment);

// Eliminar comentario
router.delete('/comments/:commentId', verifyToken, deleteComment);

export default router;
