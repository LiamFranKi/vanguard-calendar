import { query } from '../config/database.js';

// ===== OBTENER NOTIFICACIONES DEL USUARIO =====

export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20, unread_only = false } = req.query;

    let whereClause = 'WHERE usuario_id = $1';
    const params = [userId];

    if (unread_only === 'true') {
      whereClause += ' AND leida = false';
    }

    const result = await query(`
      SELECT * FROM notificaciones
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $2
    `, [userId, limit]);

    // Contar no leídas
    const unreadResult = await query(`
      SELECT COUNT(*) as count
      FROM notificaciones
      WHERE usuario_id = $1 AND leida = false
    `, [userId]);

    res.json({
      success: true,
      data: result.rows,
      unread_count: parseInt(unreadResult.rows[0].count)
    });

  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones'
    });
  }
};

// ===== MARCAR NOTIFICACIÓN COMO LEÍDA =====

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Verificar que la notificación pertenece al usuario
    const notification = await query(
      'SELECT id FROM notificaciones WHERE id = $1 AND usuario_id = $2',
      [id, userId]
    );

    if (notification.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    // Marcar como leída
    await query(
      'UPDATE notificaciones SET leida = true WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });

  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificación'
    });
  }
};

// ===== MARCAR TODAS COMO LEÍDAS =====

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    await query(
      'UPDATE notificaciones SET leida = true WHERE usuario_id = $1 AND leida = false',
      [userId]
    );

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });

  } catch (error) {
    console.error('Error al marcar todas como leídas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificaciones'
    });
  }
};

// ===== FUNCIÓN HELPER PARA CREAR NOTIFICACIONES =====

export const createNotification = async ({
  usuario_id,
  titulo,
  mensaje,
  tipo = 'info',
  relacionado_tipo = null,
  relacionado_id = null
}) => {
  try {
    // Si es un array de usuarios, crear notificación para cada uno
    const userIds = Array.isArray(usuario_id) ? usuario_id : [usuario_id];

    for (const userId of userIds) {
      await query(`
        INSERT INTO notificaciones (
          usuario_id, titulo, mensaje, tipo, 
          relacionado_tipo, relacionado_id, leida
        ) VALUES ($1, $2, $3, $4, $5, $6, false)
      `, [userId, titulo, mensaje, tipo, relacionado_tipo, relacionado_id]);
    }

    console.log(`✅ Notificación creada para ${userIds.length} usuario(s)`);
    return true;
  } catch (error) {
    console.error('❌ Error al crear notificación:', error);
    return false;
  }
};

// ===== ELIMINAR NOTIFICACIÓN =====

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Verificar que la notificación pertenece al usuario
    const result = await query(
      'DELETE FROM notificaciones WHERE id = $1 AND usuario_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notificación no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Notificación eliminada'
    });

  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar notificación'
    });
  }
};
