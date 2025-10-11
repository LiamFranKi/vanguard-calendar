import cron from 'node-cron';
import { query } from '../config/database.js';
import { createNotification } from '../controllers/notifications.controller.js';

/**
 * Job de recordatorios automáticos
 * Se ejecuta cada hora para verificar:
 * - Tareas que vencen mañana
 * - Tareas que vencen hoy
 * - Eventos que son mañana
 * - Eventos que son hoy
 */

export const startReminderJobs = () => {
  console.log('🔔 Iniciando sistema de recordatorios automáticos...');

  // Ejecutar cada hora (0 minutos de cada hora)
  // Formato cron: minuto hora día mes día-semana
  // '0 * * * *' = cada hora en punto
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Ejecutando verificación de recordatorios...', new Date().toLocaleString('es-ES'));
    
    try {
      await checkTaskReminders();
      await checkEventReminders();
    } catch (error) {
      console.error('❌ Error en job de recordatorios:', error);
    }
  });

  // También ejecutar al inicio del servidor (después de 30 segundos)
  setTimeout(async () => {
    console.log('🚀 Primera ejecución de recordatorios al iniciar servidor...');
    try {
      await checkTaskReminders();
      await checkEventReminders();
    } catch (error) {
      console.error('❌ Error en primera ejecución:', error);
    }
  }, 30000);

  console.log('✅ Sistema de recordatorios iniciado correctamente');
};

/**
 * Verificar recordatorios de TAREAS
 */
async function checkTaskReminders() {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = now.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // ===== TAREAS QUE VENCEN MAÑANA =====
    const tomorrowTasksQuery = `
      SELECT 
        t.id,
        t.titulo,
        t.fecha_vencimiento,
        t.prioridad,
        ARRAY_AGG(DISTINCT ta.usuario_id) FILTER (WHERE ta.usuario_id IS NOT NULL) as assigned_users
      FROM tareas t
      LEFT JOIN tarea_asignaciones ta ON t.id = ta.tarea_id
      WHERE DATE(t.fecha_vencimiento) = $1
        AND t.estado IN ('pendiente', 'en_progreso')
        AND NOT EXISTS (
          SELECT 1 FROM notificaciones n 
          WHERE n.relacionado_tipo = 'tarea_recordatorio_1dia'
            AND n.relacionado_id = t.id
            AND DATE(n.created_at) = CURRENT_DATE
        )
      GROUP BY t.id, t.titulo, t.fecha_vencimiento, t.prioridad
    `;

    const tomorrowTasks = await query(tomorrowTasksQuery, [tomorrowStr]);

    for (const task of tomorrowTasks.rows) {
      if (task.assigned_users && task.assigned_users.length > 0) {
        const priorityEmoji = {
          'urgente': '🔥',
          'alta': '🔴',
          'media': '🟡',
          'baja': '⚪'
        };

        await createNotification({
          usuario_id: task.assigned_users,
          titulo: `${priorityEmoji[task.prioridad] || '📋'} Recordatorio: Tarea vence mañana`,
          mensaje: `La tarea "${task.titulo}" vence mañana (${new Date(task.fecha_vencimiento).toLocaleDateString('es-ES')})`,
          tipo: 'warning',
          relacionado_tipo: 'tarea_recordatorio_1dia',
          relacionado_id: task.id
        });

        console.log(`✅ Notificación enviada: Tarea "${task.titulo}" vence mañana`);
      }
    }

    // ===== TAREAS QUE VENCEN HOY =====
    const todayTasksQuery = `
      SELECT 
        t.id,
        t.titulo,
        t.fecha_vencimiento,
        t.prioridad,
        ARRAY_AGG(DISTINCT ta.usuario_id) FILTER (WHERE ta.usuario_id IS NOT NULL) as assigned_users
      FROM tareas t
      LEFT JOIN tarea_asignaciones ta ON t.id = ta.tarea_id
      WHERE DATE(t.fecha_vencimiento) = $1
        AND t.estado IN ('pendiente', 'en_progreso')
        AND NOT EXISTS (
          SELECT 1 FROM notificaciones n 
          WHERE n.relacionado_tipo = 'tarea_recordatorio_hoy'
            AND n.relacionado_id = t.id
            AND DATE(n.created_at) = CURRENT_DATE
        )
      GROUP BY t.id, t.titulo, t.fecha_vencimiento, t.prioridad
    `;

    const todayTasks = await query(todayTasksQuery, [todayStr]);

    for (const task of todayTasks.rows) {
      if (task.assigned_users && task.assigned_users.length > 0) {
        const priorityEmoji = {
          'urgente': '🔥',
          'alta': '🔴',
          'media': '🟡',
          'baja': '⚪'
        };

        await createNotification({
          usuario_id: task.assigned_users,
          titulo: `${priorityEmoji[task.prioridad] || '📋'} ¡Urgente! Tarea vence HOY`,
          mensaje: `La tarea "${task.titulo}" vence HOY (${new Date(task.fecha_vencimiento).toLocaleDateString('es-ES')})`,
          tipo: 'error',
          relacionado_tipo: 'tarea_recordatorio_hoy',
          relacionado_id: task.id
        });

        console.log(`✅ Notificación enviada: Tarea "${task.titulo}" vence HOY`);
      }
    }

    console.log(`📋 Recordatorios de tareas: ${tomorrowTasks.rows.length} (mañana) + ${todayTasks.rows.length} (hoy)`);

  } catch (error) {
    console.error('❌ Error al verificar recordatorios de tareas:', error);
  }
}

/**
 * Verificar recordatorios de EVENTOS
 */
async function checkEventReminders() {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = now.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // ===== EVENTOS QUE SON MAÑANA =====
    const tomorrowEventsQuery = `
      SELECT 
        e.id,
        e.titulo,
        e.fecha_inicio,
        e.ubicacion,
        e.todo_el_dia,
        ARRAY_AGG(DISTINCT ea.usuario_id) FILTER (WHERE ea.usuario_id IS NOT NULL) as attendees
      FROM eventos e
      LEFT JOIN evento_asignaciones ea ON e.id = ea.evento_id
      WHERE DATE(e.fecha_inicio) = $1
        AND NOT EXISTS (
          SELECT 1 FROM notificaciones n 
          WHERE n.relacionado_tipo = 'evento_recordatorio_1dia'
            AND n.relacionado_id = e.id
            AND DATE(n.created_at) = CURRENT_DATE
        )
      GROUP BY e.id, e.titulo, e.fecha_inicio, e.ubicacion, e.todo_el_dia
    `;

    const tomorrowEvents = await query(tomorrowEventsQuery, [tomorrowStr]);

    for (const event of tomorrowEvents.rows) {
      if (event.attendees && event.attendees.length > 0) {
        const timeInfo = event.todo_el_dia 
          ? 'todo el día' 
          : new Date(event.fecha_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        const locationInfo = event.ubicacion ? ` en ${event.ubicacion}` : '';

        await createNotification({
          usuario_id: event.attendees,
          titulo: '🎉 Recordatorio: Evento mañana',
          mensaje: `El evento "${event.titulo}" es mañana a las ${timeInfo}${locationInfo}`,
          tipo: 'info',
          relacionado_tipo: 'evento_recordatorio_1dia',
          relacionado_id: event.id
        });

        console.log(`✅ Notificación enviada: Evento "${event.titulo}" es mañana`);
      }
    }

    // ===== EVENTOS QUE SON HOY =====
    const todayEventsQuery = `
      SELECT 
        e.id,
        e.titulo,
        e.fecha_inicio,
        e.ubicacion,
        e.todo_el_dia,
        ARRAY_AGG(DISTINCT ea.usuario_id) FILTER (WHERE ea.usuario_id IS NOT NULL) as attendees
      FROM eventos e
      LEFT JOIN evento_asignaciones ea ON e.id = ea.evento_id
      WHERE DATE(e.fecha_inicio) = $1
        AND NOT EXISTS (
          SELECT 1 FROM notificaciones n 
          WHERE n.relacionado_tipo = 'evento_recordatorio_hoy'
            AND n.relacionado_id = e.id
            AND DATE(n.created_at) = CURRENT_DATE
        )
      GROUP BY e.id, e.titulo, e.fecha_inicio, e.ubicacion, e.todo_el_dia
    `;

    const todayEvents = await query(todayEventsQuery, [todayStr]);

    for (const event of todayEvents.rows) {
      if (event.attendees && event.attendees.length > 0) {
        const timeInfo = event.todo_el_dia 
          ? 'todo el día' 
          : new Date(event.fecha_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        const locationInfo = event.ubicacion ? ` en ${event.ubicacion}` : '';

        await createNotification({
          usuario_id: event.attendees,
          titulo: '🎉 ¡Evento HOY!',
          mensaje: `El evento "${event.titulo}" es HOY a las ${timeInfo}${locationInfo}`,
          tipo: 'success',
          relacionado_tipo: 'evento_recordatorio_hoy',
          relacionado_id: event.id
        });

        console.log(`✅ Notificación enviada: Evento "${event.titulo}" es HOY`);
      }
    }

    console.log(`🎉 Recordatorios de eventos: ${tomorrowEvents.rows.length} (mañana) + ${todayEvents.rows.length} (hoy)`);

  } catch (error) {
    console.error('❌ Error al verificar recordatorios de eventos:', error);
  }
}

// Para testing manual (opcional)
export const testReminders = async () => {
  console.log('🧪 Ejecutando test manual de recordatorios...');
  await checkTaskReminders();
  await checkEventReminders();
  console.log('✅ Test completado');
};

