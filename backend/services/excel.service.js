import ExcelJS from 'exceljs';
import { query } from '../config/database.js';

/**
 * Generar reporte Excel profesional de Tareas
 */
export const generateTasksExcelReport = async () => {
  const workbook = new ExcelJS.Workbook();
  
  // Metadata del archivo
  workbook.creator = 'Vanguard Calendar';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ===== HOJA 1: RESUMEN GENERAL =====
  const summarySheet = workbook.addWorksheet('Resumen General', {
    properties: { tabColor: { argb: 'FF3B82F6' } }
  });

  // Encabezado principal
  summarySheet.mergeCells('A1:F1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = '🎯 VANGUARD CALENDAR - REPORTE DE TAREAS';
  titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' }
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(1).height = 40;

  // Fecha del reporte
  summarySheet.mergeCells('A2:F2');
  const dateCell = summarySheet.getCell('A2');
  dateCell.value = `Fecha de generación: ${new Date().toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`;
  dateCell.font = { italic: true, color: { argb: 'FF6B7280' } };
  dateCell.alignment = { horizontal: 'center' };

  // Obtener estadísticas
  const statsQuery = await query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN estado = 'completada' THEN 1 END) as completadas,
      COUNT(CASE WHEN estado = 'en_progreso' THEN 1 END) as en_progreso,
      COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
      COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as canceladas,
      COUNT(CASE WHEN prioridad = 'urgente' THEN 1 END) as urgentes,
      COUNT(CASE WHEN prioridad = 'alta' THEN 1 END) as alta,
      COUNT(CASE WHEN prioridad = 'media' THEN 1 END) as media,
      COUNT(CASE WHEN prioridad = 'baja' THEN 1 END) as baja,
      AVG(progreso) as promedio_progreso
    FROM tareas
  `);

  const stats = statsQuery.rows[0];

  // Tabla de estadísticas
  summarySheet.addRow([]);
  summarySheet.addRow(['ESTADÍSTICAS GENERALES']);
  summarySheet.getCell('A4').font = { size: 14, bold: true };
  summarySheet.addRow([]);

  const statsData = [
    ['Métrica', 'Cantidad', 'Porcentaje'],
    ['Total de Tareas', stats.total, '100%'],
    ['✅ Completadas', stats.completadas, `${((stats.completadas / stats.total) * 100).toFixed(1)}%`],
    ['🔄 En Progreso', stats.en_progreso, `${((stats.en_progreso / stats.total) * 100).toFixed(1)}%`],
    ['⏳ Pendientes', stats.pendientes, `${((stats.pendientes / stats.total) * 100).toFixed(1)}%`],
    ['❌ Canceladas', stats.canceladas, `${((stats.canceladas / stats.total) * 100).toFixed(1)}%`],
    ['', '', ''],
    ['🔥 Urgentes', stats.urgentes, `${((stats.urgentes / stats.total) * 100).toFixed(1)}%`],
    ['🔴 Alta Prioridad', stats.alta, `${((stats.alta / stats.total) * 100).toFixed(1)}%`],
    ['🟡 Media Prioridad', stats.media, `${((stats.media / stats.total) * 100).toFixed(1)}%`],
    ['⚪ Baja Prioridad', stats.baja, `${((stats.baja / stats.total) * 100).toFixed(1)}%`],
    ['', '', ''],
    ['📈 Progreso Promedio', `${Math.round(stats.promedio_progreso)}%`, '']
  ];

  statsData.forEach((row, index) => {
    const excelRow = summarySheet.addRow(row);
    if (index === 0) {
      // Header de la tabla
      excelRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      excelRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6B7280' }
      };
    }
  });

  // Ajustar anchos
  summarySheet.getColumn(1).width = 25;
  summarySheet.getColumn(2).width = 15;
  summarySheet.getColumn(3).width = 15;

  // ===== HOJA 2: LISTADO DE TAREAS =====
  const tasksSheet = workbook.addWorksheet('Listado de Tareas', {
    properties: { tabColor: { argb: 'FF22C55E' } }
  });

  // Obtener todas las tareas
  const tasksQuery = await query(`
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
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN tarea_asignaciones ta ON t.id = ta.tarea_id
    LEFT JOIN usuarios u ON ta.usuario_id = u.id
    GROUP BY t.id, p.name
    ORDER BY t.created_at DESC
  `);

  // Encabezado
  tasksSheet.mergeCells('A1:K1');
  const tasksTitleCell = tasksSheet.getCell('A1');
  tasksTitleCell.value = '📋 LISTADO COMPLETO DE TAREAS';
  tasksTitleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  tasksTitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF22C55E' }
  };
  tasksTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  tasksSheet.getRow(1).height = 30;

  tasksSheet.addRow([]);

  // Headers de columnas
  const headers = [
    'ID', 'Título', 'Descripción', 'Estado', 'Prioridad', 
    'Progreso', 'Categoría', 'Proyecto', 'Asignados', 
    'Vencimiento', 'Creación'
  ];
  
  const headerRow = tasksSheet.addRow(headers);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F2937' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Datos
  tasksQuery.rows.forEach(task => {
    const row = tasksSheet.addRow([
      task.id,
      task.titulo,
      task.descripcion || 'Sin descripción',
      task.estado,
      task.prioridad,
      `${task.progreso}%`,
      task.categoria,
      task.proyecto || 'Sin proyecto',
      task.asignados || 'Sin asignar',
      task.fecha_vencimiento ? new Date(task.fecha_vencimiento).toLocaleDateString('es-ES') : 'Sin fecha',
      new Date(task.created_at).toLocaleDateString('es-ES')
    ]);

    // Colorear según estado
    const estadoCell = row.getCell(4);
    switch (task.estado) {
      case 'completada':
        estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
        estadoCell.font = { color: { argb: 'FF166534' }, bold: true };
        break;
      case 'en_progreso':
        estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
        estadoCell.font = { color: { argb: 'FF1E40AF' }, bold: true };
        break;
      case 'pendiente':
        estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        estadoCell.font = { color: { argb: 'FF854D0E' }, bold: true };
        break;
      case 'cancelada':
        estadoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        estadoCell.font = { color: { argb: 'FF991B1B' }, bold: true };
        break;
    }

    // Colorear según prioridad
    const prioridadCell = row.getCell(5);
    switch (task.prioridad) {
      case 'urgente':
        prioridadCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        prioridadCell.font = { color: { argb: 'FF991B1B' }, bold: true };
        break;
      case 'alta':
        prioridadCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } };
        prioridadCell.font = { color: { argb: 'FF9A3412' }, bold: true };
        break;
      case 'media':
        prioridadCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        prioridadCell.font = { color: { argb: 'FF854D0E' }, bold: true };
        break;
      case 'baja':
        prioridadCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        prioridadCell.font = { color: { argb: 'FF6B7280' } };
        break;
    }

    // Barra de progreso visual
    const progresoCell = row.getCell(6);
    const progreso = parseInt(task.progreso);
    if (progreso >= 75) {
      progresoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22C55E' } };
      progresoCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    } else if (progreso >= 50) {
      progresoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
      progresoCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    } else if (progreso > 0) {
      progresoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
      progresoCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    }
  });

  // Ajustar anchos de columnas
  tasksSheet.columns = [
    { key: 'id', width: 8 },
    { key: 'titulo', width: 30 },
    { key: 'descripcion', width: 40 },
    { key: 'estado', width: 15 },
    { key: 'prioridad', width: 15 },
    { key: 'progreso', width: 12 },
    { key: 'categoria', width: 15 },
    { key: 'proyecto', width: 20 },
    { key: 'asignados', width: 30 },
    { key: 'vencimiento', width: 15 },
    { key: 'creacion', width: 15 }
  ];

  // Aplicar filtros automáticos
  tasksSheet.autoFilter = {
    from: 'A3',
    to: 'K3'
  };

  // ===== HOJA 3: TAREAS POR PROYECTO =====
  const projectSheet = workbook.addWorksheet('Por Proyecto', {
    properties: { tabColor: { argb: 'FF8B5CF6' } }
  });

  const projectQuery = await query(`
    SELECT 
      COALESCE(p.name, 'Sin proyecto') as proyecto,
      COALESCE(p.color, '#6b7280') as color,
      COUNT(t.id) as total_tareas,
      COUNT(CASE WHEN t.estado = 'completada' THEN 1 END) as completadas,
      COUNT(CASE WHEN t.estado = 'en_progreso' THEN 1 END) as en_progreso,
      COUNT(CASE WHEN t.estado = 'pendiente' THEN 1 END) as pendientes
    FROM tareas t
    LEFT JOIN projects p ON t.project_id = p.id
    GROUP BY p.name, p.color
    ORDER BY total_tareas DESC
  `);

  projectSheet.mergeCells('A1:F1');
  const projTitleCell = projectSheet.getCell('A1');
  projTitleCell.value = '📁 TAREAS POR PROYECTO';
  projTitleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  projTitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF8B5CF6' }
  };
  projTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  projectSheet.getRow(1).height = 30;

  projectSheet.addRow([]);
  
  const projHeaders = ['Proyecto', 'Total', 'Completadas', 'En Progreso', 'Pendientes', 'Tasa Completado'];
  const projHeaderRow = projectSheet.addRow(projHeaders);
  projHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  projHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F2937' }
  };
  projHeaderRow.alignment = { horizontal: 'center' };

  projectQuery.rows.forEach(proj => {
    const tasaCompletado = proj.total_tareas > 0 
      ? ((proj.completadas / proj.total_tareas) * 100).toFixed(1) 
      : 0;
    
    const row = projectSheet.addRow([
      proj.proyecto,
      proj.total_tareas,
      proj.completadas,
      proj.en_progreso,
      proj.pendientes,
      `${tasaCompletado}%`
    ]);

    // Colorear la tasa según el valor
    const tasaCell = row.getCell(6);
    const tasa = parseFloat(tasaCompletado);
    if (tasa >= 80) {
      tasaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22C55E' } };
      tasaCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    } else if (tasa >= 50) {
      tasaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
      tasaCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    } else {
      tasaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
      tasaCell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
    }
  });

  projectSheet.columns = [
    { width: 25 },
    { width: 12 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 18 }
  ];

  // ===== HOJA 4: PRODUCTIVIDAD POR USUARIO =====
  const userSheet = workbook.addWorksheet('Productividad', {
    properties: { tabColor: { argb: 'FFF59E0B' } }
  });

  const userQuery = await query(`
    SELECT 
      u.nombres || ' ' || u.apellidos as nombre,
      u.rol,
      COUNT(DISTINCT ta.tarea_id) as total_tareas,
      COUNT(DISTINCT CASE WHEN t.estado = 'completada' THEN ta.tarea_id END) as completadas,
      COUNT(DISTINCT tc.id) as comentarios,
      ROUND(
        CASE 
          WHEN COUNT(DISTINCT ta.tarea_id) > 0 
          THEN (COUNT(DISTINCT CASE WHEN t.estado = 'completada' THEN ta.tarea_id END)::numeric / COUNT(DISTINCT ta.tarea_id)::numeric) * 100
          ELSE 0
        END, 
        2
      ) as efectividad
    FROM usuarios u
    LEFT JOIN tarea_asignaciones ta ON u.id = ta.usuario_id
    LEFT JOIN tareas t ON ta.tarea_id = t.id
    LEFT JOIN task_comments tc ON u.id = tc.user_id
    WHERE u.activo = true
    GROUP BY u.id, u.nombres, u.apellidos, u.rol
    HAVING COUNT(DISTINCT ta.tarea_id) > 0
    ORDER BY completadas DESC, total_tareas DESC
  `);

  userSheet.mergeCells('A1:F1');
  const userTitleCell = userSheet.getCell('A1');
  userTitleCell.value = '👥 PRODUCTIVIDAD POR USUARIO';
  userTitleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  userTitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF59E0B' }
  };
  userTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  userSheet.getRow(1).height = 30;

  userSheet.addRow([]);

  const userHeaders = ['Ranking', 'Usuario', 'Rol', 'Total Tareas', 'Completadas', 'Comentarios', 'Efectividad'];
  const userHeaderRow = userSheet.addRow(userHeaders);
  userHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  userHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F2937' }
  };
  userHeaderRow.alignment = { horizontal: 'center' };

  userQuery.rows.forEach((user, index) => {
    const ranking = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
    
    const row = userSheet.addRow([
      ranking,
      user.nombre,
      user.rol,
      user.total_tareas,
      user.completadas,
      user.comentarios,
      `${user.efectividad}%`
    ]);

    // Resaltar top 3
    if (index < 3) {
      row.font = { bold: true };
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: index === 0 ? 'FFFEF3C7' : index === 1 ? 'FFF3F4F6' : 'FFFED7AA' }
      };
    }

    // Colorear efectividad
    const efecCell = row.getCell(7);
    const efec = parseFloat(user.efectividad);
    if (efec >= 80) {
      efecCell.font = { color: { argb: 'FF166534' }, bold: true };
    } else if (efec >= 50) {
      efecCell.font = { color: { argb: 'FF854D0E' }, bold: true };
    } else {
      efecCell.font = { color: { argb: 'FF991B1B' }, bold: true };
    }
  });

  userSheet.columns = [
    { width: 10 },
    { width: 30 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 },
    { width: 15 }
  ];

  return workbook;
};

/**
 * Generar reporte Excel profesional de Eventos
 */
export const generateEventsExcelReport = async () => {
  const workbook = new ExcelJS.Workbook();
  
  workbook.creator = 'Vanguard Calendar';
  workbook.created = new Date();

  const eventsSheet = workbook.addWorksheet('Eventos', {
    properties: { tabColor: { argb: 'FF22C55E' } }
  });

  // Encabezado
  eventsSheet.mergeCells('A1:H1');
  const titleCell = eventsSheet.getCell('A1');
  titleCell.value = '🎉 VANGUARD CALENDAR - REPORTE DE EVENTOS';
  titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF22C55E' }
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  eventsSheet.getRow(1).height = 40;

  eventsSheet.mergeCells('A2:H2');
  const dateCell = eventsSheet.getCell('A2');
  dateCell.value = `Fecha de generación: ${new Date().toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`;
  dateCell.font = { italic: true, color: { argb: 'FF6B7280' } };
  dateCell.alignment = { horizontal: 'center' };

  eventsSheet.addRow([]);

  // Obtener eventos
  const eventsQuery = await query(`
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
    GROUP BY e.id
    ORDER BY e.fecha_inicio DESC
  `);

  // Headers
  const headers = ['ID', 'Título', 'Descripción', 'Inicio', 'Fin', 'Ubicación', 'Todo el día', 'Asistentes'];
  const headerRow = eventsSheet.addRow(headers);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F2937' }
  };
  headerRow.alignment = { horizontal: 'center' };
  headerRow.height = 25;

  // Datos
  eventsQuery.rows.forEach(event => {
    const row = eventsSheet.addRow([
      event.id,
      event.titulo,
      event.descripcion || 'Sin descripción',
      new Date(event.fecha_inicio).toLocaleString('es-ES'),
      event.fecha_fin ? new Date(event.fecha_fin).toLocaleString('es-ES') : '',
      event.ubicacion || 'Sin ubicación',
      event.todo_el_dia ? 'Sí' : 'No',
      event.asistentes || 'Sin asistentes'
    ]);

    // Resaltar eventos de todo el día
    if (event.todo_el_dia) {
      row.getCell(7).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDBEAFE' }
      };
      row.getCell(7).font = { color: { argb: 'FF1E40AF' }, bold: true };
    }
  });

  // Ajustar anchos
  eventsSheet.columns = [
    { width: 8 },
    { width: 30 },
    { width: 40 },
    { width: 20 },
    { width: 20 },
    { width: 25 },
    { width: 12 },
    { width: 35 }
  ];

  eventsSheet.autoFilter = {
    from: 'A4',
    to: 'H4'
  };

  return workbook;
};

