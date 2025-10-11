import { query } from '../config/database.js';
import { createNotification } from './notifications.controller.js';

// ===== CONTROLADOR SIMPLIFICADO DE TAREAS =====
// Adaptado para usar la estructura de BD en español

export const getAllTasks = async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      project_id,
      search,
      view = 'list'
    } = req.query;

    let whereConditions = ['1=1'];
    let params = [];
    let paramCount = 0;

    // Filtros
    if (status) {
      paramCount++;
      whereConditions.push(`t.estado = $${paramCount}`);
      params.push(status);
    }

    if (priority) {
      paramCount++;
      whereConditions.push(`t.prioridad = $${paramCount}`);
      params.push(priority);
    }

    if (project_id) {
      paramCount++;
      whereConditions.push(`t.project_id = $${paramCount}`);
      params.push(project_id);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(
        t.titulo ILIKE $${paramCount} OR 
        t.descripcion ILIKE $${paramCount} OR 
        t.categoria ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
    }

    // Query principal
    const baseQuery = `
      SELECT 
        t.id,
        t.titulo as title,
        t.descripcion as description,
        t.fecha_vencimiento as due_date,
        t.prioridad as priority,
        t.estado as status,
        t.categoria,
        t.project_id,
        t.estimacion_horas,
        t.progreso,
        t.tags,
        t.created_at,
        t.updated_at,
        p.name as project_name,
        p.color as project_color,
        COALESCE(creator.nombres, '') as creator_name,
        COALESCE(creator.apellidos, '') as creator_lastname,
        COUNT(DISTINCT ta.id) as assignee_count,
        COUNT(DISTINCT tc.id) as comment_count
      FROM tareas t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN usuarios creator ON t.creado_por = creator.id
      LEFT JOIN tarea_asignaciones ta ON t.id = ta.tarea_id
      LEFT JOIN task_comments tc ON t.id = tc.task_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY t.id, p.name, p.color, creator.nombres, creator.apellidos, creator.avatar
      ORDER BY t.created_at DESC
    `;

    const result = await query(baseQuery, params);

    // Para cada tarea, obtener los asignados
    for (const task of result.rows) {
      const assigneesResult = await query(`
        SELECT u.id, u.nombres, u.apellidos, u.avatar, ta.rol as role
        FROM tarea_asignaciones ta
        JOIN usuarios u ON ta.usuario_id = u.id
        WHERE ta.tarea_id = $1
      `, [task.id]);
      task.assignees = assigneesResult.rows;
    }

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tareas',
      error: error.message
    });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const taskQuery = `
      SELECT 
        t.id,
        t.titulo as title,
        t.descripcion as description,
        t.fecha_vencimiento as due_date,
        t.prioridad as priority,
        t.estado as status,
        t.categoria,
        t.project_id,
        t.estimacion_horas,
        t.progreso,
        t.tags,
        t.created_at,
        t.updated_at,
        p.name as project_name,
        p.color as project_color,
        creator.nombres as creator_name,
        creator.apellidos as creator_lastname
      FROM tareas t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN usuarios creator ON t.creado_por = creator.id
      WHERE t.id = $1
    `;

    const taskResult = await query(taskQuery, [id]);
    
    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    const task = taskResult.rows[0];

    // Obtener asignados
    const assigneesResult = await query(`
      SELECT u.id, u.nombres, u.apellidos, u.avatar, ta.rol as role
      FROM tarea_asignaciones ta
      JOIN usuarios u ON ta.usuario_id = u.id
      WHERE ta.tarea_id = $1
    `, [id]);
    task.assignees = assigneesResult.rows;

    // Obtener comentarios
    const commentsResult = await query(`
      SELECT 
        tc.*,
        u.nombres, u.apellidos, u.avatar
      FROM task_comments tc
      JOIN usuarios u ON tc.user_id = u.id
      WHERE tc.task_id = $1 AND tc.parent_id IS NULL
      ORDER BY tc.created_at DESC
    `, [id]);
    task.comments = commentsResult.rows;

    // Obtener subtareas
    const subtasksResult = await query(`
      SELECT * FROM task_subtasks
      WHERE task_id = $1
      ORDER BY order_index, created_at
    `, [id]);
    task.subtasks = subtasksResult.rows;

    res.json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error('Error al obtener tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tarea'
    });
  }
};

export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      due_date,
      priority = 'media',
      status = 'pendiente',
      categoria = 'general',
      project_id,
      estimacion_horas,
      progreso = 0,
      tags = [],
      assignees = []
    } = req.body;

    const userId = req.userId;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El título es requerido'
      });
    }

    // Crear tarea (adaptado a estructura en español)
    const createTaskQuery = `
      INSERT INTO tareas (
        titulo, descripcion, fecha_vencimiento, prioridad, estado, 
        categoria, project_id, estimacion_horas, progreso, tags, creado_por
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, titulo as title, descripcion as description, 
                prioridad as priority, estado as status, progreso, created_at
    `;

    // Convertir tags a array de PostgreSQL
    const tagsArray = Array.isArray(tags) ? tags : [];

    const taskResult = await query(createTaskQuery, [
      title.trim(),
      description || null,
      due_date || null,
      priority,
      status,
      categoria,
      project_id || null,
      estimacion_horas || null,
      progreso,
      tagsArray,
      userId
    ]);

    const task = taskResult.rows[0];

    // Asignar usuarios a la tarea
    if (assignees && assignees.length > 0) {
      for (const assigneeId of assignees) {
        await query(`
          INSERT INTO tarea_asignaciones (tarea_id, usuario_id, rol)
          VALUES ($1, $2, $3)
        `, [task.id, assigneeId, 'asignado']);
      }

      // Notificar a los usuarios asignados
      await createNotification({
        usuario_id: assignees,
        titulo: '📋 Nueva tarea asignada',
        mensaje: `Has sido asignado a la tarea: "${title}"`,
        tipo: 'info',
        relacionado_tipo: 'tarea',
        relacionado_id: task.id
      });
    }

    // Registrar en historial
    await query(`
      INSERT INTO task_history (task_id, user_id, action, changes)
      VALUES ($1, $2, $3, $4)
    `, [task.id, userId, 'created', { 
      title, 
      priority, 
      status,
      categoria,
      assignees_count: assignees.length
    }]);

    res.status(201).json({
      success: true,
      data: task,
      message: 'Tarea creada exitosamente'
    });

  } catch (error) {
    console.error('Error al crear tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear tarea',
      error: error.message
    });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.userId;
    const assignees = updates.assignees;

    // Mapeo de campos frontend -> backend
    const fieldMap = {
      title: 'titulo',
      description: 'descripcion',
      due_date: 'fecha_vencimiento',
      priority: 'prioridad',
      status: 'estado',
      categoria: 'categoria',
      project_id: 'project_id',
      estimacion_horas: 'estimacion_horas',
      progreso: 'progreso',
      tags: 'tags'
    };

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    for (const [frontendField, backendField] of Object.entries(fieldMap)) {
      if (updates[frontendField] !== undefined) {
        paramCount++;
        updateFields.push(`${backendField} = $${paramCount}`);
        updateValues.push(updates[frontendField]);
      }
    }

    if (updateFields.length === 0 && !assignees) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos válidos para actualizar'
      });
    }

    // Actualizar la tarea si hay campos
    if (updateFields.length > 0) {
      paramCount++;
      updateFields.push(`updated_at = $${paramCount}`);
      updateValues.push(new Date());

      paramCount++;
      updateValues.push(id);

      const updateQuery = `
        UPDATE tareas 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, titulo as title, descripcion as description, 
                  prioridad as priority, estado as status, progreso
      `;

      const result = await query(updateQuery, updateValues);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }
    }

    // Actualizar asignaciones si se enviaron
    if (assignees !== undefined && Array.isArray(assignees)) {
      console.log('📝 Actualizando asignaciones para tarea:', id);
      console.log('👥 Nuevos asignados:', assignees);
      
      try {
        // Obtener asignados anteriores para comparar
        const previousAssignees = await query(
          'SELECT usuario_id FROM tarea_asignaciones WHERE tarea_id = $1',
          [id]
        );
        const previousIds = previousAssignees.rows.map(a => a.usuario_id);

        // Eliminar asignaciones actuales
        await query('DELETE FROM tarea_asignaciones WHERE tarea_id = $1', [id]);
        console.log('🗑️ Asignaciones anteriores eliminadas');

        // Agregar nuevas asignaciones
        if (assignees.length > 0) {
          for (const assigneeId of assignees) {
            console.log(`➕ Asignando usuario ${assigneeId} a tarea ${id}`);
            await query(`
              INSERT INTO tarea_asignaciones (tarea_id, usuario_id, rol)
              VALUES ($1, $2, $3)
            `, [id, assigneeId, 'asignado']);
          }
          console.log('✅ Todas las asignaciones guardadas');

          // Notificar a NUEVOS usuarios asignados (que no estaban antes)
          const newAssignees = assignees.filter(aid => !previousIds.includes(aid));
          if (newAssignees.length > 0) {
            const taskInfo = await query('SELECT titulo FROM tareas WHERE id = $1', [id]);
            const taskTitle = taskInfo.rows[0]?.titulo || 'una tarea';
            
            await createNotification({
              usuario_id: newAssignees,
              titulo: '📋 Asignado a tarea',
              mensaje: `Has sido asignado a: "${taskTitle}"`,
              tipo: 'info',
              relacionado_tipo: 'tarea',
              relacionado_id: id
            });
          }
        }
      } catch (assignError) {
        console.error('❌ Error al asignar usuarios:', assignError);
        throw assignError;
      }
    }

    // Notificar cambio de estado importante
    if (updates.status && (updates.status === 'completada' || updates.status === 'cancelada')) {
      try {
        // Obtener usuarios asignados
        const assignedUsers = await query(
          'SELECT usuario_id FROM tarea_asignaciones WHERE tarea_id = $1',
          [id]
        );
        const userIds = assignedUsers.rows.map(a => a.usuario_id).filter(uid => uid !== userId);
        
        if (userIds.length > 0) {
          const taskInfo = await query('SELECT titulo FROM tareas WHERE id = $1', [id]);
          const taskTitle = taskInfo.rows[0]?.titulo || 'una tarea';
          
          const statusText = updates.status === 'completada' ? 'completada ✅' : 'cancelada ❌';
          
          await createNotification({
            usuario_id: userIds,
            titulo: `🔔 Tarea ${statusText}`,
            mensaje: `La tarea "${taskTitle}" fue ${statusText}`,
            tipo: updates.status === 'completada' ? 'success' : 'warning',
            relacionado_tipo: 'tarea',
            relacionado_id: id
          });
        }
      } catch (notifError) {
        console.error('Error al crear notificación de estado:', notifError);
      }
    }

    // Registrar en historial (solo cambios importantes)
    try {
      const changesForHistory = {};
      if (updates.status) changesForHistory.status = updates.status;
      if (updates.priority) changesForHistory.priority = updates.priority;
      if (updates.progreso !== undefined) changesForHistory.progreso = updates.progreso;
      if (assignees) changesForHistory.assignees_updated = true;

      await query(`
        INSERT INTO task_history (task_id, user_id, action, changes)
        VALUES ($1, $2, $3, $4)
      `, [id, userId, 'updated', JSON.stringify(changesForHistory)]);
    } catch (historyError) {
      console.error('Error al registrar historial:', historyError);
      // No fallar si el historial falla
    }

    res.json({
      success: true,
      data: { id },
      message: 'Tarea actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar tarea',
      error: error.message
    });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM tareas WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Tarea eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar tarea'
    });
  }
};

// ===== PROYECTOS =====

export const getAllProjects = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        p.*,
        COUNT(t.id) as task_count
      FROM projects p
      LEFT JOIN tareas t ON p.id = t.project_id
      GROUP BY p.id
      ORDER BY p.name
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proyectos'
    });
  }
};

export const createProject = async (req, res) => {
  try {
    const { name, description, color = '#3b82f6' } = req.body;
    const createdBy = req.userId;

    const result = await query(`
      INSERT INTO projects (name, description, color, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, description, color, createdBy]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Proyecto creado exitosamente'
    });

  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear proyecto'
    });
  }
};

// ===== COMENTARIOS =====

export const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.userId;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El comentario no puede estar vacío'
      });
    }

    // Crear comentario
    const commentResult = await query(`
      INSERT INTO task_comments (task_id, user_id, content, type)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [taskId, userId, content.trim(), 'comment']);

    const comment = commentResult.rows[0];

    // Obtener información del usuario
    const userResult = await query(`
      SELECT id, nombres, apellidos, avatar 
      FROM usuarios 
      WHERE id = $1
    `, [userId]);

    const commentWithUser = {
      ...comment,
      user: userResult.rows[0]
    };

    // Registrar en historial
    await query(`
      INSERT INTO task_history (task_id, user_id, action, changes)
      VALUES ($1, $2, $3, $4)
    `, [taskId, userId, 'commented', { 
      content: content.substring(0, 100) 
    }]);

    // Notificar a usuarios asignados (excepto quien comentó)
    try {
      const assignedUsers = await query(
        'SELECT usuario_id FROM tarea_asignaciones WHERE tarea_id = $1',
        [taskId]
      );
      const userIds = assignedUsers.rows.map(a => a.usuario_id).filter(uid => uid !== userId);
      
      if (userIds.length > 0) {
        const taskInfo = await query('SELECT titulo FROM tareas WHERE id = $1', [taskId]);
        const taskTitle = taskInfo.rows[0]?.titulo || 'una tarea';
        const userName = commentWithUser.user.nombres + ' ' + commentWithUser.user.apellidos;
        
        await createNotification({
          usuario_id: userIds,
          titulo: '💬 Nuevo comentario',
          mensaje: `${userName} comentó en: "${taskTitle}"`,
          tipo: 'info',
          relacionado_tipo: 'tarea',
          relacionado_id: taskId
        });
      }
    } catch (notifError) {
      console.error('Error al crear notificación de comentario:', notifError);
    }

    res.status(201).json({
      success: true,
      data: commentWithUser,
      message: 'Comentario agregado exitosamente'
    });

  } catch (error) {
    console.error('Error al agregar comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar comentario',
      error: error.message
    });
  }
};

export const getComments = async (req, res) => {
  try {
    const { taskId } = req.params;

    const commentsResult = await query(`
      SELECT 
        tc.*,
        u.nombres, 
        u.apellidos, 
        u.avatar,
        u.rol
      FROM task_comments tc
      JOIN usuarios u ON tc.user_id = u.id
      WHERE tc.task_id = $1
      ORDER BY tc.created_at DESC
    `, [taskId]);

    res.json({
      success: true,
      data: commentsResult.rows
    });

  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comentarios'
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.userId;

    // Verificar que el comentario existe y pertenece al usuario o es admin
    const commentResult = await query(`
      SELECT tc.*, u.rol 
      FROM task_comments tc
      JOIN usuarios u ON u.id = $1
      WHERE tc.id = $2
    `, [userId, commentId]);

    if (commentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }

    const comment = commentResult.rows[0];

    // Solo el autor o un admin pueden eliminar
    if (comment.user_id !== userId && comment.rol !== 'Administrador') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este comentario'
      });
    }

    // Eliminar comentario
    await query('DELETE FROM task_comments WHERE id = $1', [commentId]);

    res.json({
      success: true,
      message: 'Comentario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar comentario',
      error: error.message
    });
  }
};
