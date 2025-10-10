import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

// ===== FUNCIONES BÁSICAS =====

export const getAllTasks = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      priority, 
      assigned_to, 
      project_id,
      search,
      tags,
      view = 'list' // list, kanban, timeline
    } = req.query;

    const offset = (page - 1) * limit;
    
    let whereConditions = ['1=1'];
    let params = [];
    let paramCount = 0;

    // Filtros
    if (status) {
      paramCount++;
      whereConditions.push(`t.status = $${paramCount}`);
      params.push(status);
    }

    if (priority) {
      paramCount++;
      whereConditions.push(`t.priority = $${paramCount}`);
      params.push(priority);
    }

    if (assigned_to) {
      paramCount++;
      whereConditions.push(`EXISTS (
        SELECT 1 FROM task_assignments ta 
        WHERE ta.task_id = t.id AND ta.user_id = $${paramCount}
      )`);
      params.push(assigned_to);
    }

    if (project_id) {
      paramCount++;
      whereConditions.push(`t.project_id = $${paramCount}`);
      params.push(project_id);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(
        t.title ILIKE $${paramCount} OR 
        t.description ILIKE $${paramCount} OR 
        t.categoria ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
    }

    if (tags && tags.length > 0) {
      paramCount++;
      whereConditions.push(`t.tags && $${paramCount}`);
      params.push(tags);
    }

    // Query principal con información completa
    const baseQuery = `
      SELECT 
        t.*,
        p.name as project_name,
        p.color as project_color,
        creator.nombres as creator_name,
        creator.apellidos as creator_lastname,
        creator.avatar as creator_avatar,
        COUNT(DISTINCT ta.id) as assignee_count,
        COUNT(DISTINCT tc.id) as comment_count,
        COUNT(DISTINCT ts.id) as subtask_count,
        SUM(CASE WHEN ts.completed THEN 1 ELSE 0 END) as subtask_completed,
        COALESCE(SUM(tte.duration_minutes), 0) as total_time_minutes
      FROM tareas t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN usuarios creator ON t.creado_por = creator.id
      LEFT JOIN tarea_asignaciones ta ON t.id = ta.tarea_id
      LEFT JOIN task_comments tc ON t.id = tc.task_id
      LEFT JOIN task_subtasks ts ON t.id = ts.task_id
      LEFT JOIN task_time_entries tte ON t.id = tte.task_id AND tte.is_running = false
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY t.id, p.name, p.color, creator.nombres, creator.apellidos, creator.avatar
    `;

    // Para vista Kanban, agrupar por status
    if (view === 'kanban') {
      const kanbanQuery = `
        ${baseQuery}
        ORDER BY 
          CASE t.status 
            WHEN 'pendiente' THEN 1
            WHEN 'en_progreso' THEN 2
            WHEN 'en_revision' THEN 3
            WHEN 'completada' THEN 4
            WHEN 'cancelada' THEN 5
          END,
          t.priority DESC,
          t.due_date ASC,
          t.created_at DESC
      `;
      
      const result = await query(kanbanQuery, params);
      
      // Agrupar por status para Kanban
      const kanbanData = {
        pendiente: [],
        en_progreso: [],
        en_revision: [],
        completada: [],
        cancelada: []
      };

      result.rows.forEach(task => {
        if (kanbanData[task.status]) {
          kanbanData[task.status].push(task);
        }
      });

      // Obtener asignados para cada tarea
      for (const status in kanbanData) {
        for (const task of kanbanData[status]) {
          const assigneesResult = await query(`
            SELECT u.id, u.nombres, u.apellidos, u.avatar, ta.role
            FROM task_assignments ta
            JOIN users u ON ta.user_id = u.id
            WHERE ta.task_id = $1
          `, [task.id]);
          task.assignees = assigneesResult.rows;
        }
      }

      return res.json({
        success: true,
        data: kanbanData,
        total: result.rows.length
      });
    }

    // Para otras vistas, paginación normal
    const countQuery = `
      SELECT COUNT(*) as total
      FROM tasks t
      WHERE ${whereConditions.join(' AND ')}
    `;

    const [tasksResult, countResult] = await Promise.all([
      query(`${baseQuery} ORDER BY t.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`, 
        [...params, limit, offset]),
      query(countQuery, params)
    ]);

    // Obtener asignados para cada tarea
    for (const task of tasksResult.rows) {
      const assigneesResult = await query(`
        SELECT u.id, u.nombres, u.apellidos, u.avatar, ta.role
        FROM task_assignments ta
        JOIN users u ON ta.user_id = u.id
        WHERE ta.task_id = $1
      `, [task.id]);
      task.assignees = assigneesResult.rows;
    }

    res.json({
      success: true,
      data: tasksResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tareas'
    });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener tarea con toda la información
    const taskQuery = `
      SELECT 
        t.*,
        p.name as project_name,
        p.color as project_color,
        creator.nombres as creator_name,
        creator.apellidos as creator_lastname,
        creator.avatar as creator_avatar
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users creator ON t.created_by = creator.id
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
      SELECT u.id, u.nombres, u.apellidos, u.avatar, ta.role, ta.assigned_at
      FROM task_assignments ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.task_id = $1
    `, [id]);
    task.assignees = assigneesResult.rows;

    // Obtener comentarios con información de usuarios
    const commentsResult = await query(`
      SELECT 
        tc.*,
        u.nombres, u.apellidos, u.avatar,
        COUNT(replies.id) as reply_count
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      LEFT JOIN task_comments replies ON tc.id = replies.parent_id
      WHERE tc.task_id = $1 AND tc.parent_id IS NULL
      GROUP BY tc.id, u.nombres, u.apellidos, u.avatar
      ORDER BY tc.created_at ASC
    `, [id]);

    // Obtener respuestas para cada comentario
    for (const comment of commentsResult.rows) {
      const repliesResult = await query(`
        SELECT tc.*, u.nombres, u.apellidos, u.avatar
        FROM task_comments tc
        JOIN users u ON tc.user_id = u.id
        WHERE tc.parent_id = $1
        ORDER BY tc.created_at ASC
      `, [comment.id]);
      comment.replies = repliesResult.rows;
    }
    task.comments = commentsResult.rows;

    // Obtener subtareas
    const subtasksResult = await query(`
      SELECT 
        ts.*,
        u.nombres as completed_by_name,
        u.apellidos as completed_by_lastname
      FROM task_subtasks ts
      LEFT JOIN users u ON ts.completed_by = u.id
      WHERE ts.task_id = $1
      ORDER BY ts.order_index, ts.created_at
    `, [id]);
    task.subtasks = subtasksResult.rows;

    // Obtener dependencias
    const dependenciesResult = await query(`
      SELECT 
        td.*,
        dep_task.title as depends_on_title,
        dep_task.status as depends_on_status,
        dep_task.priority as depends_on_priority
      FROM task_dependencies td
      JOIN tasks dep_task ON td.depends_on_task_id = dep_task.id
      WHERE td.task_id = $1
    `, [id]);
    task.dependencies = dependenciesResult.rows;

    // Obtener historial
    const historyResult = await query(`
      SELECT 
        th.*,
        u.nombres, u.apellidos, u.avatar
      FROM task_history th
      LEFT JOIN users u ON th.user_id = u.id
      WHERE th.task_id = $1
      ORDER BY th.created_at DESC
      LIMIT 50
    `, [id]);
    task.history = historyResult.rows;

    // Obtener archivos adjuntos
    const attachmentsResult = await query(`
      SELECT 
        att.*,
        u.nombres as uploaded_by_name,
        u.apellidos as uploaded_by_lastname
      FROM attachments att
      LEFT JOIN users u ON att.uploaded_by = u.id
      WHERE att.task_id = $1
      ORDER BY att.created_at DESC
    `, [id]);
    task.attachments = attachmentsResult.rows;

    // Obtener time entries
    const timeEntriesResult = await query(`
      SELECT 
        tte.*,
        u.nombres, u.apellidos, u.avatar
      FROM task_time_entries tte
      JOIN users u ON tte.user_id = u.id
      WHERE tte.task_id = $1
      ORDER BY tte.start_time DESC
    `, [id]);
    task.time_entries = timeEntriesResult.rows;

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
      tags = [],
      assignees = [], // Array de { user_id, role }
      subtasks = [] // Array de { title, description }
    } = req.body;

    const userId = req.userId;

    // Validaciones
    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El título es requerido'
      });
    }

    // Crear tarea
    const createTaskQuery = `
      INSERT INTO tasks (
        title, description, due_date, priority, status, categoria,
        project_id, estimacion_horas, tags, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const taskResult = await query(createTaskQuery, [
      title.trim(),
      description,
      due_date,
      priority,
      status,
      categoria,
      project_id,
      estimacion_horas,
      tags,
      userId
    ]);

    const task = taskResult.rows[0];

    // Agregar asignados
    if (assignees && assignees.length > 0) {
      for (const assignee of assignees) {
        await query(`
          INSERT INTO task_assignments (task_id, user_id, role, assigned_by)
          VALUES ($1, $2, $3, $4)
        `, [task.id, assignee.user_id, assignee.role || 'collaborator', userId]);
      }
    }

    // Agregar subtareas
    if (subtasks && subtasks.length > 0) {
      for (let i = 0; i < subtasks.length; i++) {
        const subtask = subtasks[i];
        await query(`
          INSERT INTO task_subtasks (task_id, title, description, order_index)
          VALUES ($1, $2, $3, $4)
        `, [task.id, subtask.title, subtask.description, i]);
      }
    }

    // Registrar en historial
    await query(`
      INSERT INTO task_history (task_id, user_id, action, changes)
      VALUES ($1, $2, $3, $4)
    `, [task.id, userId, 'created', { 
      title, 
      description, 
      priority, 
      status,
      categoria,
      assignees: assignees.length
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
      message: 'Error al crear tarea'
    });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.userId;

    // Obtener tarea actual para comparar cambios
    const currentTaskResult = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    
    if (currentTaskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    const currentTask = currentTaskResult.rows[0];

    // Preparar campos a actualizar
    const allowedFields = [
      'title', 'description', 'due_date', 'priority', 'status', 
      'categoria', 'project_id', 'estimacion_horas', 'progreso', 'tags'
    ];

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        paramCount++;
        updateFields.push(`${field} = $${paramCount}`);
        updateValues.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos válidos para actualizar'
      });
    }

    // Agregar updated_at
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateValues.push(new Date());

    // Actualizar tarea
    paramCount++;
    updateValues.push(id);

    const updateQuery = `
      UPDATE tasks 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);
    const updatedTask = result.rows[0];

    // Detectar cambios para historial
    const changes = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined && currentTask[field] !== updates[field]) {
        changes[field] = {
          old: currentTask[field],
          new: updates[field]
        };
      }
    }

    // Registrar cambios en historial si hay cambios
    if (Object.keys(changes).length > 0) {
      await query(`
        INSERT INTO task_history (task_id, user_id, action, changes, old_values, new_values)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        id, 
        userId, 
        'updated', 
        changes,
        currentTask,
        updatedTask
      ]);
    }

    res.json({
      success: true,
      data: updatedTask,
      message: 'Tarea actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar tarea'
    });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Verificar que la tarea existe
    const taskResult = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    
    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Eliminar tarea (cascade eliminará asignaciones, comentarios, etc.)
    await query('DELETE FROM tasks WHERE id = $1', [id]);

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

// ===== FUNCIONES DE ASIGNACIONES =====

export const assignUserToTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { user_id, role = 'collaborator' } = req.body;
    const assignedBy = req.userId;

    // Verificar que la tarea existe
    const taskResult = await query('SELECT id FROM tasks WHERE id = $1', [taskId]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Verificar que el usuario existe
    const userResult = await query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Asignar usuario
    const assignResult = await query(`
      INSERT INTO task_assignments (task_id, user_id, role, assigned_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (task_id, user_id) 
      DO UPDATE SET role = $3, assigned_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [taskId, user_id, role, assignedBy]);

    // Registrar en historial
    await query(`
      INSERT INTO task_history (task_id, user_id, action, changes)
      VALUES ($1, $2, $3, $4)
    `, [taskId, assignedBy, 'assigned', { 
      assigned_user: user_id, 
      role 
    }]);

    res.json({
      success: true,
      data: assignResult.rows[0],
      message: 'Usuario asignado exitosamente'
    });

  } catch (error) {
    console.error('Error al asignar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar usuario'
    });
  }
};

export const removeUserFromTask = async (req, res) => {
  try {
    const { taskId, userId } = req.params;
    const removedBy = req.userId;

    // Eliminar asignación
    const result = await query(`
      DELETE FROM task_assignments 
      WHERE task_id = $1 AND user_id = $2
      RETURNING *
    `, [taskId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asignación no encontrada'
      });
    }

    // Registrar en historial
    await query(`
      INSERT INTO task_history (task_id, user_id, action, changes)
      VALUES ($1, $2, $3, $4)
    `, [taskId, removedBy, 'unassigned', { 
      removed_user: userId 
    }]);

    res.json({
      success: true,
      message: 'Usuario removido exitosamente'
    });

  } catch (error) {
    console.error('Error al remover usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al remover usuario'
    });
  }
};

// ===== FUNCIONES DE COMENTARIOS =====

export const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, type = 'comment', parent_id, mentions = [] } = req.body;
    const userId = req.userId;

    // Verificar que la tarea existe
    const taskResult = await query('SELECT id FROM tasks WHERE id = $1', [taskId]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Crear comentario
    const commentResult = await query(`
      INSERT INTO task_comments (task_id, user_id, content, type, parent_id, mentions)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [taskId, userId, content, type, parent_id, mentions]);

    const comment = commentResult.rows[0];

    // Obtener información del usuario
    const userResult = await query(`
      SELECT id, nombres, apellidos, avatar 
      FROM users 
      WHERE id = $1
    `, [userId]);

    comment.user = userResult.rows[0];

    // Registrar en historial
    await query(`
      INSERT INTO task_history (task_id, user_id, action, changes)
      VALUES ($1, $2, $3, $4)
    `, [taskId, userId, 'commented', { 
      comment_id: comment.id,
      content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      mentions: mentions.length
    }]);

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comentario agregado exitosamente'
    });

  } catch (error) {
    console.error('Error al agregar comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar comentario'
    });
  }
};

export const addReaction = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { emoji } = req.body;
    const userId = req.userId;

    // Obtener comentario actual
    const commentResult = await query(`
      SELECT reactions, task_id FROM task_comments WHERE id = $1
    `, [commentId]);

    if (commentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }

    const comment = commentResult.rows[0];
    const reactions = comment.reactions || {};

    // Agregar o remover reacción
    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    const userIndex = reactions[emoji].indexOf(userId);
    if (userIndex > -1) {
      // Remover reacción
      reactions[emoji].splice(userIndex, 1);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      // Agregar reacción
      reactions[emoji].push(userId);
    }

    // Actualizar comentario
    await query(`
      UPDATE task_comments 
      SET reactions = $1 
      WHERE id = $2
    `, [JSON.stringify(reactions), commentId]);

    res.json({
      success: true,
      data: reactions,
      message: 'Reacción actualizada'
    });

  } catch (error) {
    console.error('Error al agregar reacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar reacción'
    });
  }
};

// ===== FUNCIONES DE SUBTAREAS =====

export const addSubtask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description } = req.body;
    const userId = req.userId;

    // Verificar que la tarea existe
    const taskResult = await query('SELECT id FROM tasks WHERE id = $1', [taskId]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tarea no encontrada'
      });
    }

    // Obtener siguiente order_index
    const orderResult = await query(`
      SELECT COALESCE(MAX(order_index), -1) + 1 as next_order
      FROM task_subtasks 
      WHERE task_id = $1
    `, [taskId]);

    const subtaskResult = await query(`
      INSERT INTO task_subtasks (task_id, title, description, order_index)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [taskId, title, description, orderResult.rows[0].next_order]);

    res.status(201).json({
      success: true,
      data: subtaskResult.rows[0],
      message: 'Subtarea agregada exitosamente'
    });

  } catch (error) {
    console.error('Error al agregar subtarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar subtarea'
    });
  }
};

export const updateSubtask = async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const { title, description, completed } = req.body;
    const userId = req.userId;

    // Obtener subtarea actual
    const currentResult = await query('SELECT * FROM task_subtasks WHERE id = $1', [subtaskId]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subtarea no encontrada'
      });
    }

    const current = currentResult.rows[0];

    // Preparar actualización
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (title !== undefined) {
      paramCount++;
      updates.push(`title = $${paramCount}`);
      values.push(title);
    }

    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      values.push(description);
    }

    if (completed !== undefined) {
      paramCount++;
      updates.push(`completed = $${paramCount}`);
      updates.push(`completed_at = $${paramCount + 1}`);
      updates.push(`completed_by = $${paramCount + 2}`);
      values.push(completed);
      values.push(completed ? new Date() : null);
      values.push(completed ? userId : null);
      paramCount += 2;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    paramCount++;
    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    paramCount++;
    values.push(subtaskId);

    const updateQuery = `
      UPDATE task_subtasks 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(updateQuery, values);
    const updatedSubtask = result.rows[0];

    // Actualizar progreso de la tarea principal
    const progressResult = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed
      FROM task_subtasks 
      WHERE task_id = $1
    `, [current.task_id]);

    const progress = progressResult.rows[0];
    const newProgress = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

    await query(`
      UPDATE tasks 
      SET progreso = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [newProgress, current.task_id]);

    res.json({
      success: true,
      data: updatedSubtask,
      progress: newProgress,
      message: 'Subtarea actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar subtarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar subtarea'
    });
  }
};

export const deleteSubtask = async (req, res) => {
  try {
    const { subtaskId } = req.params;

    // Obtener task_id antes de eliminar
    const subtaskResult = await query('SELECT task_id FROM task_subtasks WHERE id = $1', [subtaskId]);
    if (subtaskResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subtarea no encontrada'
      });
    }

    const taskId = subtaskResult.rows[0].task_id;

    // Eliminar subtarea
    await query('DELETE FROM task_subtasks WHERE id = $1', [subtaskId]);

    // Actualizar progreso de la tarea principal
    const progressResult = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed
      FROM task_subtasks 
      WHERE task_id = $1
    `, [taskId]);

    const progress = progressResult.rows[0];
    const newProgress = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

    await query(`
      UPDATE tasks 
      SET progreso = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [newProgress, taskId]);

    res.json({
      success: true,
      progress: newProgress,
      message: 'Subtarea eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar subtarea:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar subtarea'
    });
  }
};

// ===== FUNCIONES DE PROYECTOS =====

export const getAllProjects = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        p.*,
        COUNT(t.id) as task_count,
        COUNT(CASE WHEN t.status = 'completada' THEN 1 END) as completed_count
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
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

// ===== FUNCIONES DE TEMPLATES =====

export const getAllTemplates = async (req, res) => {
  try {
    const { category } = req.query;
    
    let whereClause = '';
    let params = [];
    
    if (category) {
      whereClause = 'WHERE category = $1';
      params = [category];
    }

    const result = await query(`
      SELECT 
        tt.*,
        u.nombres as created_by_name,
        u.apellidos as created_by_lastname
      FROM task_templates tt
      LEFT JOIN users u ON tt.created_by = u.id
      ${whereClause}
      ORDER BY tt.usage_count DESC, tt.name
    `, params);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error al obtener templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener templates'
    });
  }
};

export const createTaskFromTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { project_id, assignees = [] } = req.body;
    const userId = req.userId;

    // Obtener template
    const templateResult = await query('SELECT * FROM task_templates WHERE id = $1', [templateId]);
    if (templateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template no encontrado'
      });
    }

    const template = templateResult.rows[0];
    const templateData = template.template_data;

    // Crear tarea desde template
    const createTaskQuery = `
      INSERT INTO tasks (
        title, description, priority, status, categoria,
        project_id, estimacion_horas, tags, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const taskResult = await query(createTaskQuery, [
      templateData.title || 'Nueva tarea',
      templateData.description || '',
      templateData.priority || 'media',
      'pendiente',
      templateData.categoria || 'general',
      project_id,
      templateData.estimacion_horas,
      templateData.tags || [],
      userId
    ]);

    const task = taskResult.rows[0];

    // Agregar asignados si se especificaron
    if (assignees && assignees.length > 0) {
      for (const assignee of assignees) {
        await query(`
          INSERT INTO task_assignments (task_id, user_id, role, assigned_by)
          VALUES ($1, $2, $3, $4)
        `, [task.id, assignee.user_id, assignee.role || 'collaborator', userId]);
      }
    }

    // Incrementar contador de uso del template
    await query(`
      UPDATE task_templates 
      SET usage_count = usage_count + 1 
      WHERE id = $1
    `, [templateId]);

    res.status(201).json({
      success: true,
      data: task,
      message: 'Tarea creada desde template exitosamente'
    });

  } catch (error) {
    console.error('Error al crear tarea desde template:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear tarea desde template'
    });
  }
};

// ===== FUNCIONES DE TIME TRACKING =====

export const startTimeTracking = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { description } = req.body;
    const userId = req.userId;

    // Verificar que no hay un time entry corriendo para este usuario
    const runningResult = await query(`
      SELECT id FROM task_time_entries 
      WHERE user_id = $1 AND is_running = true
    `, [userId]);

    if (runningResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes un cronómetro corriendo en otra tarea'
      });
    }

    // Crear nuevo time entry
    const result = await query(`
      INSERT INTO task_time_entries (task_id, user_id, start_time, description, is_running)
      VALUES ($1, $2, $3, $3, $4, true)
      RETURNING *
    `, [taskId, userId, new Date(), description]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Cronómetro iniciado'
    });

  } catch (error) {
    console.error('Error al iniciar time tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar cronómetro'
    });
  }
};

export const stopTimeTracking = async (req, res) => {
  try {
    const { timeEntryId } = req.params;
    const userId = req.userId;

    // Obtener time entry actual
    const currentResult = await query(`
      SELECT * FROM task_time_entries 
      WHERE id = $1 AND user_id = $2 AND is_running = true
    `, [timeEntryId, userId]);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Time entry no encontrado o no está corriendo'
      });
    }

    const current = currentResult.rows[0];
    const endTime = new Date();
    const duration = Math.round((endTime - new Date(current.start_time)) / 60000); // minutos

    // Actualizar time entry
    const result = await query(`
      UPDATE task_time_entries 
      SET end_time = $1, duration_minutes = $2, is_running = false
      WHERE id = $3
      RETURNING *
    `, [endTime, duration, timeEntryId]);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Cronómetro detenido'
    });

  } catch (error) {
    console.error('Error al detener time tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Error al detener cronómetro'
    });
  }
};

// ===== FUNCIONES DE ANALYTICS =====

export const getTaskAnalytics = async (req, res) => {
  try {
    const { period = '30', project_id } = req.query;
    const userId = req.userId;

    let whereClause = '';
    let params = [userId];
    let paramCount = 1;

    if (project_id) {
      paramCount++;
      whereClause += ` AND t.project_id = $${paramCount}`;
      params.push(project_id);
    }

    // Tareas por estado
    const statusResult = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM tasks t
      JOIN task_assignments ta ON t.id = ta.task_id
      WHERE ta.user_id = $1 ${whereClause}
      GROUP BY status
      ORDER BY count DESC
    `, params);

    // Tareas por prioridad
    const priorityResult = await query(`
      SELECT 
        priority,
        COUNT(*) as count
      FROM tasks t
      JOIN task_assignments ta ON t.id = ta.task_id
      WHERE ta.user_id = $1 ${whereClause}
      GROUP BY priority
      ORDER BY count DESC
    `, params);

    // Tareas completadas en el período
    const completedResult = await query(`
      SELECT 
        DATE(updated_at) as date,
        COUNT(*) as count
      FROM tasks t
      JOIN task_assignments ta ON t.id = ta.task_id
      WHERE ta.user_id = $1 
        AND t.status = 'completada' 
        AND t.updated_at >= CURRENT_DATE - INTERVAL '${period} days'
        ${whereClause}
      GROUP BY DATE(updated_at)
      ORDER BY date
    `, params);

    // Tiempo trabajado
    const timeResult = await query(`
      SELECT 
        DATE(start_time) as date,
        SUM(duration_minutes) as total_minutes
      FROM task_time_entries tte
      JOIN tasks t ON tte.task_id = t.id
      WHERE tte.user_id = $1 
        AND tte.start_time >= CURRENT_DATE - INTERVAL '${period} days'
        AND tte.is_running = false
        ${whereClause}
      GROUP BY DATE(start_time)
      ORDER BY date
    `, params);

    // Productividad por día de la semana
    const productivityResult = await query(`
      SELECT 
        EXTRACT(DOW FROM updated_at) as day_of_week,
        COUNT(*) as completed_tasks
      FROM tasks t
      JOIN task_assignments ta ON t.id = ta.task_id
      WHERE ta.user_id = $1 
        AND t.status = 'completada'
        AND t.updated_at >= CURRENT_DATE - INTERVAL '${period} days'
        ${whereClause}
      GROUP BY EXTRACT(DOW FROM updated_at)
      ORDER BY day_of_week
    `, params);

    res.json({
      success: true,
      data: {
        by_status: statusResult.rows,
        by_priority: priorityResult.rows,
        completed_over_time: completedResult.rows,
        time_tracking: timeResult.rows,
        productivity_by_day: productivityResult.rows
      }
    });

  } catch (error) {
    console.error('Error al obtener analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener analytics'
    });
  }
};
