import express from 'express';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getAllProjects,
  createProject
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

export default router;
