import { query } from '../config/database.js';
import { createNotification } from './notifications.controller.js';

// ===== OBTENER EVENTOS DEL CALENDARIO =====
export const getCalendarEvents = async (req, res) => {
  try {
    const { start_date, end_date, type = 'all' } = req.query;
    const userId = req.userId;

    let calendarItems = [];

    // Obtener tareas si se solicita
    if (type === 'all' || type === 'tasks') {
      try {
        const tasksQuery = `
          SELECT 
            t.id,
            t.titulo as title,
            t.descripcion as description,
            t.fecha_vencimiento as date,
            t.prioridad as priority,
            t.estado as status,
            t.progreso,
            'task' as type,
            ARRAY_AGG(
              CASE 
                WHEN ta.usuario_id IS NOT NULL 
                THEN json_build_object(
                  'id', u.id,
                  'nombres', u.nombres,
                  'apellidos', u.apellidos,
                  'avatar', u.avatar
                )
                ELSE NULL
              END
            ) FILTER (WHERE ta.usuario_id IS NOT NULL) as assignees
          FROM tareas t
          LEFT JOIN tarea_asignaciones ta ON t.id = ta.tarea_id
          LEFT JOIN usuarios u ON ta.usuario_id = u.id
          WHERE t.fecha_vencimiento IS NOT NULL
          ${start_date ? `AND t.fecha_vencimiento >= $1` : ''}
          ${end_date ? `AND t.fecha_vencimiento <= $${start_date ? '2' : '1'}` : ''}
          GROUP BY t.id, t.titulo, t.descripcion, t.fecha_vencimiento, t.prioridad, t.estado, t.progreso
          ORDER BY t.fecha_vencimiento ASC
        `;

        const params = [];
        if (start_date) params.push(start_date);
        if (end_date) params.push(end_date);

        const tasksResult = await query(tasksQuery, params);
        calendarItems = [...calendarItems, ...tasksResult.rows];
      } catch (taskError) {
        console.error('Error al obtener tareas:', taskError.message);
      }
    }

    // Obtener eventos si se solicita
    if (type === 'all' || type === 'events') {
      try {
        const eventsQuery = `
          SELECT 
            e.id,
            e.titulo as title,
            e.descripcion as description,
            e.fecha_inicio as date,
            e.fecha_fin as end_date,
            e.ubicacion,
            e.color,
            e.todo_el_dia as all_day,
            'event' as type,
          ARRAY_AGG(
            CASE 
              WHEN ea.usuario_id IS NOT NULL 
              THEN json_build_object(
                'id', u.id,
                'nombres', u.nombres,
                'apellidos', u.apellidos,
                'avatar', u.avatar
              )
              ELSE NULL
            END
          ) FILTER (WHERE ea.usuario_id IS NOT NULL) as attendees
        FROM eventos e
        LEFT JOIN evento_asignaciones ea ON e.id = ea.evento_id
        LEFT JOIN usuarios u ON ea.usuario_id = u.id
          WHERE 1=1
          ${start_date ? `AND e.fecha_inicio >= $1` : ''}
          ${end_date ? `AND e.fecha_inicio <= $${start_date ? '2' : '1'}` : ''}
          GROUP BY e.id, e.titulo, e.descripcion, e.fecha_inicio, e.fecha_fin, e.ubicacion, e.color, e.todo_el_dia
          ORDER BY e.fecha_inicio ASC
        `;

        const params = [];
        if (start_date) params.push(start_date);
        if (end_date) params.push(end_date);

        const eventsResult = await query(eventsQuery, params);
        calendarItems = [...calendarItems, ...eventsResult.rows];
      } catch (eventError) {
        console.error('⚠️ Error al obtener eventos (tabla eventos puede no existir):', eventError.message);
        // Si la tabla no existe, simplemente continuar sin eventos
      }
    }

    // Ordenar por fecha
    calendarItems.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: calendarItems,
      message: 'Eventos del calendario obtenidos exitosamente'
    });

  } catch (error) {
    console.error('❌ Error al obtener eventos del calendario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener eventos del calendario',
      error: error.message
    });
  }
};

// ===== CREAR EVENTO =====
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      fecha_inicio,
      fecha_fin,
      ubicacion,
      color = '#22c55e',
      todo_el_dia = false,
      attendees = []
    } = req.body;

    const userId = req.userId;

    if (!title || !fecha_inicio) {
      return res.status(400).json({
        success: false,
        message: 'El título y fecha de inicio son requeridos'
      });
    }

    // Crear evento
    const eventResult = await query(`
      INSERT INTO eventos (
        titulo, descripcion, fecha_inicio, fecha_fin, 
        ubicacion, color, todo_el_dia, creado_por
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      title.trim(),
      description || null,
      fecha_inicio,
      fecha_fin || fecha_inicio,
      ubicacion || null,
      color,
      todo_el_dia,
      userId
    ]);

    const event = eventResult.rows[0];

    // Agregar asistentes y notificar
    if (attendees && attendees.length > 0) {
      for (const attendeeId of attendees) {
        await query(`
          INSERT INTO evento_asignaciones (evento_id, usuario_id, rol)
          VALUES ($1, $2, $3)
        `, [event.id, attendeeId, 'participante']);
      }

      // Notificar a los asistentes (asíncrono - no bloquea la respuesta)
      setImmediate(async () => {
        try {
          await createNotification({
            usuario_id: attendees,
            titulo: '🎉 Invitación a evento',
            mensaje: `Has sido invitado al evento: "${title}"`,
            tipo: 'info',
            relacionado_tipo: 'evento',
            relacionado_id: event.id
          });
        } catch (notifError) {
          console.error('Error al crear notificación:', notifError);
        }
      });
    }

    res.status(201).json({
      success: true,
      data: event,
      message: 'Evento creado exitosamente'
    });

  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear evento',
      error: error.message
    });
  }
};

// ===== ACTUALIZAR EVENTO =====
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const attendees = updates.attendees;

    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    // Mapeo de campos frontend (inglés) -> backend (español)
    const fieldMap = {
      'title': 'titulo',
      'description': 'descripcion',
      'fecha_inicio': 'fecha_inicio',
      'fecha_fin': 'fecha_fin',
      'ubicacion': 'ubicacion',
      'color': 'color',
      'todo_el_dia': 'todo_el_dia'
    };

    for (const [frontendField, backendField] of Object.entries(fieldMap)) {
      if (updates[frontendField] !== undefined) {
        paramCount++;
        updateFields.push(`${backendField} = $${paramCount}`);
        updateValues.push(updates[frontendField]);
      }
    }

    if (updateFields.length === 0 && !attendees) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos válidos para actualizar'
      });
    }

    // Actualizar evento
    if (updateFields.length > 0) {
      // Agregar updated_at (sin parámetro)
      updateFields.push(`updated_at = NOW()`);
      
      // Agregar el ID como último parámetro
      paramCount++;
      updateValues.push(id);

      const updateQuery = `
        UPDATE eventos 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await query(updateQuery, updateValues);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Evento no encontrado'
        });
      }
    }

    // Actualizar asistentes si se enviaron
    if (attendees !== undefined && Array.isArray(attendees)) {
      await query('DELETE FROM evento_asignaciones WHERE evento_id = $1', [id]);

      if (attendees.length > 0) {
        for (const attendeeId of attendees) {
          await query(`
            INSERT INTO evento_asignaciones (evento_id, usuario_id, rol)
            VALUES ($1, $2, $3)
          `, [id, attendeeId, 'participante']);
        }
      }
    }

    res.json({
      success: true,
      data: { id },
      message: 'Evento actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar evento',
      error: error.message
    });
  }
};

// ===== ELIMINAR EVENTO =====
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Eliminar asistentes primero
    await query('DELETE FROM evento_asignaciones WHERE evento_id = $1', [id]);

    // Eliminar evento
    const result = await query('DELETE FROM eventos WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Evento eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar evento',
      error: error.message
    });
  }
};

// ===== OBTENER EVENTO POR ID =====
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const eventResult = await query(`
      SELECT 
        e.*,
        ARRAY_AGG(
          CASE 
            WHEN ea.usuario_id IS NOT NULL 
            THEN json_build_object(
              'id', u.id,
              'nombres', u.nombres,
              'apellidos', u.apellidos,
              'avatar', u.avatar,
              'rol', ea.rol
            )
            ELSE NULL
          END
        ) FILTER (WHERE ea.usuario_id IS NOT NULL) as attendees
      FROM eventos e
      LEFT JOIN evento_asignaciones ea ON e.id = ea.evento_id
      LEFT JOIN usuarios u ON ea.usuario_id = u.id
      WHERE e.id = $1
      GROUP BY e.id
    `, [id]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    res.json({
      success: true,
      data: eventResult.rows[0]
    });

  } catch (error) {
    console.error('Error al obtener evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener evento',
      error: error.message
    });
  }
};

