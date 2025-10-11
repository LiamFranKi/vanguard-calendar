import express from 'express';
import { 
  getTaskAttachments, 
  uploadAttachment, 
  downloadAttachment, 
  deleteAttachment,
  upload 
} from '../controllers/attachments.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// GET /api/attachments/task/:taskId - Obtener adjuntos de una tarea
router.get('/task/:taskId', getTaskAttachments);

// POST /api/attachments/task/:taskId - Subir adjunto a una tarea
router.post('/task/:taskId', upload.single('file'), uploadAttachment);

// GET /api/attachments/:attachmentId/download - Descargar adjunto
router.get('/:attachmentId/download', downloadAttachment);

// DELETE /api/attachments/:attachmentId - Eliminar adjunto
router.delete('/:attachmentId', deleteAttachment);

export default router;
