import { query } from '../config/database.js';
import { generateTasksExcelReport, generateEventsExcelReport } from '../services/excel.service.js';

// ===== OBTENER ESTADÍSTICAS GENERALES =====
export const getGeneralStats = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Estadísticas de tareas
    const tasksStatsQuery = `
      SELECT 
        COUNT(*) as total_tareas,
        COUNT(CASE WHEN estado = 'completada' THEN 1 END) as tareas_completadas,
        COUNT(CASE WHEN estado = 'en_progreso' THEN 1 END) as tareas_en_progreso,
        COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as tareas_pendientes,
        COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as tareas_canceladas,
        COUNT(CASE WHEN prioridad = 'urgente' THEN 1 END) as tareas_urgentes,
        COUNT(CASE WHEN prioridad = 'alta' THEN 1 END) as tareas_alta,
        COUNT(CASE WHEN prioridad = 'media' THEN 1 END) as tareas_media,
        COUNT(CASE WHEN prioridad = 'baja' THEN 1 END) as tareas_baja,
        AVG(progreso) as promedio_progreso
      FROM tareas
      WHERE 1=1
      ${start_date ? `AND created_at >= $1` : ''}
      ${end_date ? `AND created_at <= $${start_date ? '2' : '1'}` : ''}
    `;

    const params = [];
    if (start_date) params.push(start_date);
    if (end_date) params.push(end_date);

    const tasksStats = await query(tasksStatsQuery, params);

    // Estadísticas de eventos
    const eventsStatsQuery = `
      SELECT 
        COUNT(*) as total_eventos,
        COUNT(CASE WHEN todo_el_dia = true THEN 1 END) as eventos_todo_dia,
        COUNT(CASE WHEN todo_el_dia = false THEN 1 END) as eventos_con_hora
      FROM eventos
      WHERE 1=1
      ${start_date ? `AND created_at >= $1` : ''}
      ${end_date ? `AND created_at <= $${start_date ? '2' : '1'}` : ''}
    `;

    const eventsStats = await query(eventsStatsQuery, params);

    // Estadísticas de usuarios
    const usersStatsQuery = `
      SELECT 
        COUNT(*) as total_usuarios,
        COUNT(CASE WHEN activo = true THEN 1 END) as usuarios_activos,
        COUNT(CASE WHEN rol = 'Administrador' THEN 1 END) as administradores
      FROM usuarios
    `;

    const usersStats = await query(usersStatsQuery);

    // Tareas por proyecto
    const tasksByProjectQuery = `
      SELECT 
        COALESCE(p.name, 'Sin proyecto') as proyecto,
        COALESCE(p.color, '#6b7280') as color,
        COUNT(t.id) as cantidad
      FROM tareas t
      LEFT JOIN projects p ON t.proyecto_id = p.id
      GROUP BY p.name, p.color
      ORDER BY cantidad DESC
    `;

    const tasksByProject = await query(tasksByProjectQuery);

    // Tareas por usuario
    const tasksByUserQuery = `
      SELECT 
        u.nombres || ' ' || u.apellidos as usuario,
        u.avatar,
        COUNT(DISTINCT ta.tarea_id) as tareas_asignadas,
        COUNT(DISTINCT CASE WHEN t.estado = 'completada' THEN ta.tarea_id END) as tareas_completadas
      FROM usuarios u
      LEFT JOIN tarea_asignaciones ta ON u.id = ta.usuario_id
      LEFT JOIN tareas t ON ta.tarea_id = t.id
      GROUP BY u.id, u.nombres, u.apellidos, u.avatar
      HAVING COUNT(DISTINCT ta.tarea_id) > 0
      ORDER BY tareas_asignadas DESC
      LIMIT 10
    `;

    const tasksByUser = await query(tasksByUserQuery);

    // Eventos próximos (próximos 30 días)
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const endDateStr = futureDate.toISOString().split('T')[0];

    const upcomingEventsQuery = `
      SELECT 
        DATE(fecha_inicio) as fecha,
        COUNT(*) as cantidad
      FROM eventos
      WHERE fecha_inicio >= $1 AND fecha_inicio <= $2
      GROUP BY DATE(fecha_inicio)
      ORDER BY fecha ASC
    `;

    const upcomingEvents = await query(upcomingEventsQuery, [today, endDateStr]);

    // Tareas completadas por mes (últimos 6 meses)
    const completedByMonthQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', updated_at), 'Mon YYYY') as mes,
        COUNT(*) as cantidad
      FROM tareas
      WHERE estado = 'completada'
        AND updated_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', updated_at)
      ORDER BY DATE_TRUNC('month', updated_at) ASC
    `;

    const completedByMonth = await query(completedByMonthQuery);

    res.json({
      success: true,
      data: {
        tasks: tasksStats.rows[0],
        events: eventsStats.rows[0],
        users: usersStats.rows[0],
        tasksByProject: tasksByProject.rows,
        tasksByUser: tasksByUser.rows,
        upcomingEvents: upcomingEvents.rows,
        completedByMonth: completedByMonth.rows
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

// ===== OBTENER REPORTE DETALLADO DE TAREAS =====
export const getTasksReport = async (req, res) => {
  try {
    const { start_date, end_date, status, priority, proyecto_id, user_id } = req.query;

    let whereConditions = ['1=1'];
    let params = [];
    let paramCount = 0;

    if (start_date) {
      paramCount++;
      whereConditions.push(`t.created_at >= $${paramCount}`);
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      whereConditions.push(`t.created_at <= $${paramCount}`);
      params.push(end_date);
    }

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

    if (proyecto_id) {
      paramCount++;
      whereConditions.push(`t.proyecto_id = $${paramCount}`);
      params.push(proyecto_id);
    }

    if (user_id) {
      paramCount++;
      whereConditions.push(`EXISTS (
        SELECT 1 FROM tarea_asignaciones ta 
        WHERE ta.tarea_id = t.id AND ta.usuario_id = $${paramCount}
      )`);
      params.push(user_id);
    }

    const reportQuery = `
      SELECT 
        t.id,
        t.titulo as title,
        t.descripcion as description,
        t.fecha_vencimiento as due_date,
        t.prioridad as priority,
        t.estado as status,
        t.progreso,
        t.categoria,
        t.estimacion_horas,
        t.created_at,
        t.updated_at,
        p.name as project_name,
        p.color as project_color,
        creator.nombres || ' ' || creator.apellidos as creador,
        ARRAY_AGG(
          DISTINCT CASE 
            WHEN ta.usuario_id IS NOT NULL 
            THEN u.nombres || ' ' || u.apellidos
          END
        ) FILTER (WHERE ta.usuario_id IS NOT NULL) as asignados
      FROM tareas t
      LEFT JOIN projects p ON t.proyecto_id = p.id
      LEFT JOIN usuarios creator ON t.creado_por = creator.id
      LEFT JOIN tarea_asignaciones ta ON t.id = ta.tarea_id
      LEFT JOIN usuarios u ON ta.usuario_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY t.id, p.name, p.color, creator.nombres, creator.apellidos
      ORDER BY t.created_at DESC
    `;

    const result = await query(reportQuery, params);

    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });

  } catch (error) {
    console.error('Error al generar reporte de tareas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte',
      error: error.message
    });
  }
};

// ===== OBTENER REPORTE DETALLADO DE EVENTOS =====
export const getEventsReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let whereConditions = ['1=1'];
    let params = [];
    let paramCount = 0;

    if (start_date) {
      paramCount++;
      whereConditions.push(`e.fecha_inicio >= $${paramCount}`);
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      whereConditions.push(`e.fecha_inicio <= $${paramCount}`);
      params.push(end_date);
    }

    const reportQuery = `
      SELECT 
        e.id,
        e.titulo as title,
        e.descripcion as description,
        e.fecha_inicio,
        e.fecha_fin,
        e.ubicacion,
        e.color,
        e.todo_el_dia,
        e.created_at,
        creator.nombres || ' ' || creator.apellidos as creador,
        ARRAY_AGG(
          DISTINCT CASE 
            WHEN ea.usuario_id IS NOT NULL 
            THEN u.nombres || ' ' || u.apellidos
          END
        ) FILTER (WHERE ea.usuario_id IS NOT NULL) as asistentes
      FROM eventos e
      LEFT JOIN usuarios creator ON e.creado_por = creator.id
      LEFT JOIN evento_asignaciones ea ON e.id = ea.evento_id
      LEFT JOIN usuarios u ON ea.usuario_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY e.id, creator.nombres, creator.apellidos
      ORDER BY e.fecha_inicio DESC
    `;

    const result = await query(reportQuery, params);

    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });

  } catch (error) {
    console.error('Error al generar reporte de eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte',
      error: error.message
    });
  }
};

// ===== OBTENER PRODUCTIVIDAD POR USUARIO =====
export const getUserProductivity = async (req, res) => {
  try {
    const productivityQuery = `
      SELECT 
        u.id,
        u.nombres || ' ' || u.apellidos as nombre,
        u.avatar,
        u.rol,
        COUNT(DISTINCT ta.tarea_id) as total_tareas,
        COUNT(DISTINCT CASE WHEN t.estado = 'completada' THEN ta.tarea_id END) as tareas_completadas,
        COUNT(DISTINCT CASE WHEN t.estado = 'en_progreso' THEN ta.tarea_id END) as tareas_en_progreso,
        COUNT(DISTINCT CASE WHEN t.estado = 'pendiente' THEN ta.tarea_id END) as tareas_pendientes,
        COUNT(DISTINCT tc.id) as total_comentarios,
        ROUND(
          CASE 
            WHEN COUNT(DISTINCT ta.tarea_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN t.estado = 'completada' THEN ta.tarea_id END)::numeric / COUNT(DISTINCT ta.tarea_id)::numeric) * 100
            ELSE 0
          END, 
          2
        ) as tasa_completado
      FROM usuarios u
      LEFT JOIN tarea_asignaciones ta ON u.id = ta.usuario_id
      LEFT JOIN tareas t ON ta.tarea_id = t.id
      LEFT JOIN task_comments tc ON u.id = tc.user_id
      WHERE u.activo = true
      GROUP BY u.id, u.nombres, u.apellidos, u.avatar, u.rol
      ORDER BY tareas_completadas DESC, total_tareas DESC
    `;

    const result = await query(productivityQuery);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error al obtener productividad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productividad',
      error: error.message
    });
  }
};

// ===== OBTENER TIMELINE DE ACTIVIDAD =====
export const getActivityTimeline = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const timelineQuery = `
      SELECT 
        th.id,
        th.action,
        th.changes,
        th.created_at,
        t.titulo as tarea_titulo,
        u.nombres || ' ' || u.apellidos as usuario,
        u.avatar,
        'tarea' as tipo
      FROM task_history th
      LEFT JOIN tareas t ON th.task_id = t.id
      LEFT JOIN usuarios u ON th.user_id = u.id
      ORDER BY th.created_at DESC
      LIMIT $1
    `;

    const result = await query(timelineQuery, [limit]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error al obtener timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener timeline',
      error: error.message
    });
  }
};

// ===== EXPORTAR REPORTE A EXCEL (PROFESIONAL) =====
export const exportToExcel = async (req, res) => {
  try {
    const { type = 'tasks' } = req.query;

    let workbook;
    let filename;

    if (type === 'tasks') {
      workbook = await generateTasksExcelReport();
      filename = `Reporte_Tareas_${new Date().toISOString().split('T')[0]}.xlsx`;
    } else if (type === 'events') {
      workbook = await generateEventsExcelReport();
      filename = `Reporte_Eventos_${new Date().toISOString().split('T')[0]}.xlsx`;
    }

    // Configurar headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Escribir el archivo
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error al exportar Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar Excel',
      error: error.message
    });
  }
};

// ===== EXPORTAR REPORTE A CSV (SIMPLE) =====
export const exportToCSV = async (req, res) => {
  try {
    const { type = 'tasks', start_date, end_date } = req.query;

    let csvData = '';
    let filename = '';

    if (type === 'tasks') {
      const tasksQuery = `
        SELECT 
          t.id,
          t.titulo,
          t.descripcion,
          t.estado,
          t.prioridad,
          t.progreso,
          t.categoria,
          t.fecha_vencimiento,
          t.created_at,
          p.name as proyecto,
          STRING_AGG(DISTINCT u.nombres || ' ' || u.apellidos, ', ') as asignados
        FROM tareas t
        LEFT JOIN projects p ON t.proyecto_id = p.id
        LEFT JOIN tarea_asignaciones ta ON t.id = ta.tarea_id
        LEFT JOIN usuarios u ON ta.usuario_id = u.id
        WHERE 1=1
        ${start_date ? `AND t.created_at >= '${start_date}'` : ''}
        ${end_date ? `AND t.created_at <= '${end_date}'` : ''}
        GROUP BY t.id, p.name
        ORDER BY t.created_at DESC
      `;

      const result = await query(tasksQuery);

      // Crear CSV
      csvData = 'ID,Título,Descripción,Estado,Prioridad,Progreso,Categoría,Proyecto,Asignados,Fecha Vencimiento,Fecha Creación\n';
      
      result.rows.forEach(row => {
        csvData += `${row.id},"${row.titulo || ''}","${(row.descripcion || '').replace(/"/g, '""')}",${row.estado},${row.prioridad},${row.progreso}%,${row.categoria},"${row.proyecto || 'Sin proyecto'}","${row.asignados || 'Sin asignar'}",${row.fecha_vencimiento || ''},${row.created_at}\n`;
      });

      filename = `reporte_tareas_${new Date().toISOString().split('T')[0]}.csv`;

    } else if (type === 'events') {
      const eventsQuery = `
        SELECT 
          e.id,
          e.titulo,
          e.descripcion,
          e.fecha_inicio,
          e.fecha_fin,
          e.ubicacion,
          e.todo_el_dia,
          e.created_at,
          STRING_AGG(DISTINCT u.nombres || ' ' || u.apellidos, ', ') as asistentes
        FROM eventos e
        LEFT JOIN evento_asignaciones ea ON e.id = ea.evento_id
        LEFT JOIN usuarios u ON ea.usuario_id = u.id
        WHERE 1=1
        ${start_date ? `AND e.created_at >= '${start_date}'` : ''}
        ${end_date ? `AND e.created_at <= '${end_date}'` : ''}
        GROUP BY e.id
        ORDER BY e.fecha_inicio DESC
      `;

      const result = await query(eventsQuery);

      // Crear CSV
      csvData = 'ID,Título,Descripción,Fecha Inicio,Fecha Fin,Ubicación,Todo el Día,Asistentes,Fecha Creación\n';
      
      result.rows.forEach(row => {
        csvData += `${row.id},"${row.titulo || ''}","${(row.descripcion || '').replace(/"/g, '""')}",${row.fecha_inicio},${row.fecha_fin || ''},${row.ubicacion || ''},${row.todo_el_dia ? 'Sí' : 'No'},"${row.asistentes || 'Sin asistentes'}",${row.created_at}\n`;
      });

      filename = `reporte_eventos_${new Date().toISOString().split('T')[0]}.csv`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csvData); // BOM para Excel UTF-8

  } catch (error) {
    console.error('Error al exportar CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar CSV',
      error: error.message
    });
  }
};

