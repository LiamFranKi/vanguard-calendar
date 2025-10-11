import { query } from '../config/database.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurar multer para adjuntos
import multer from 'multer';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = join(__dirname, '../uploads/attachments');
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para evitar conflictos
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB límite
  },
  fileFilter: (req, file, cb) => {
    // Permitir solo ciertos tipos de archivo
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
    }
  }
});

export { upload };

// ===== OBTENER ADJUNTOS DE UNA TAREA =====
export const getTaskAttachments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.userId;

    // Verificar que el usuario está asignado a la tarea
    const assignmentCheck = await query(
      'SELECT 1 FROM tarea_asignaciones WHERE tarea_id = $1 AND usuario_id = $2',
      [taskId, userId]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver los archivos de esta tarea'
      });
    }

    // Obtener adjuntos
    const result = await query(`
      SELECT 
        ta.*,
        u.nombres,
        u.apellidos,
        u.avatar
      FROM task_attachments ta
      JOIN usuarios u ON ta.user_id = u.id
      WHERE ta.task_id = $1
      ORDER BY ta.created_at DESC
    `, [taskId]);

    // Formatear datos para incluir objeto user
    const formattedAttachments = result.rows.map(attachment => ({
      ...attachment,
      user: {
        nombres: attachment.nombres,
        apellidos: attachment.apellidos,
        avatar: attachment.avatar
      }
    }));

    res.json({
      success: true,
      data: formattedAttachments,
      message: 'Adjuntos obtenidos exitosamente'
    });

  } catch (error) {
    console.error('Error al obtener adjuntos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener adjuntos',
      error: error.message
    });
  }
};

// ===== SUBIR ADJUNTO =====
export const uploadAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    // Verificar que el usuario está asignado a la tarea
    const assignmentCheck = await query(
      'SELECT 1 FROM tarea_asignaciones WHERE tarea_id = $1 AND usuario_id = $2',
      [taskId, userId]
    );

    if (assignmentCheck.rows.length === 0) {
      // Eliminar archivo subido si no tiene permisos
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para subir archivos a esta tarea'
      });
    }

    // Obtener el número de versión más alto para este archivo
    const versionResult = await query(`
      SELECT MAX(version) as max_version 
      FROM task_attachments 
      WHERE task_id = $1 AND original_name = $2
    `, [taskId, req.file.originalname]);

    const version = (versionResult.rows[0]?.max_version || 0) + 1;

    // Guardar en base de datos
    const result = await query(`
      INSERT INTO task_attachments (
        task_id, user_id, filename, original_name, 
        file_path, file_size, file_type, version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      taskId,
      userId,
      req.file.filename,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      version
    ]);

    // Obtener información del usuario
    const userResult = await query(
      'SELECT nombres, apellidos, avatar FROM usuarios WHERE id = $1',
      [userId]
    );

    const attachment = {
      ...result.rows[0],
      user: {
        nombres: userResult.rows[0].nombres,
        apellidos: userResult.rows[0].apellidos,
        avatar: userResult.rows[0].avatar
      }
    };

    res.status(201).json({
      success: true,
      data: attachment,
      message: 'Archivo subido exitosamente'
    });

  } catch (error) {
    console.error('Error al subir adjunto:', error);
    
    // Eliminar archivo si hay error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Error al subir archivo',
      error: error.message
    });
  }
};

// ===== DESCARGAR ADJUNTO =====
export const downloadAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.userId;

    // Obtener información del adjunto
    const result = await query(`
      SELECT ta.*, t.id as task_id
      FROM task_attachments ta
      JOIN tareas t ON ta.task_id = t.id
      WHERE ta.id = $1
    `, [attachmentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    const attachment = result.rows[0];

    // Verificar que el usuario está asignado a la tarea
    const assignmentCheck = await query(
      'SELECT 1 FROM tarea_asignaciones WHERE tarea_id = $1 AND usuario_id = $2',
      [attachment.task_id, userId]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para descargar este archivo'
      });
    }

    // Verificar que el archivo existe en el servidor
    if (!fs.existsSync(attachment.file_path)) {
      return res.status(404).json({
        success: false,
        message: 'El archivo no existe en el servidor'
      });
    }

    // Configurar headers para descarga
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_name}"`);
    res.setHeader('Content-Type', attachment.file_type);

    // Enviar archivo
    const fileStream = fs.createReadStream(attachment.file_path);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error al descargar adjunto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar archivo',
      error: error.message
    });
  }
};

// ===== ELIMINAR ADJUNTO =====
export const deleteAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.userId;

    // Obtener información del adjunto
    const result = await query(`
      SELECT ta.*, t.id as task_id
      FROM task_attachments ta
      JOIN tareas t ON ta.task_id = t.id
      WHERE ta.id = $1
    `, [attachmentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      });
    }

    const attachment = result.rows[0];

    // Verificar que el usuario está asignado a la tarea
    const assignmentCheck = await query(
      'SELECT 1 FROM tarea_asignaciones WHERE tarea_id = $1 AND usuario_id = $2',
      [attachment.task_id, userId]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este archivo'
      });
    }

    // Eliminar archivo del servidor
    if (fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }

    // Eliminar registro de la base de datos
    await query('DELETE FROM task_attachments WHERE id = $1', [attachmentId]);

    res.json({
      success: true,
      message: 'Archivo eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar adjunto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar archivo',
      error: error.message
    });
  }
};

// ===== FUNCIÓN HELPER: ELIMINAR ADJUNTOS DE TAREA =====
export const deleteTaskAttachments = async (taskId) => {
  try {
    // Obtener todos los adjuntos de la tarea
    const result = await query(
      'SELECT file_path FROM task_attachments WHERE task_id = $1',
      [taskId]
    );

    // Eliminar archivos del servidor
    for (const attachment of result.rows) {
      if (fs.existsSync(attachment.file_path)) {
        fs.unlinkSync(attachment.file_path);
      }
    }

    // Eliminar registros de la base de datos
    await query('DELETE FROM task_attachments WHERE task_id = $1', [taskId]);

    console.log(`✅ Adjuntos eliminados para tarea ${taskId}`);
    return true;

  } catch (error) {
    console.error('Error al eliminar adjuntos de tarea:', error);
    return false;
  }
};
