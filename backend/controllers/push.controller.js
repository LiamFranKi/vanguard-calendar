import webpush from 'web-push';
import { query } from '../config/database.js';

// Configurar web-push con las claves VAPID
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.EMAIL_USER || 'mailto:admin@vanguardcalendar.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_EMAIL,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  console.log('✅ Web Push configurado correctamente');
} else {
  console.warn('⚠️ VAPID keys no configuradas. Push notifications no funcionarán.');
}

/**
 * Obtener la clave pública VAPID
 */
export const getVapidPublicKey = (req, res) => {
  try {
    if (!VAPID_PUBLIC_KEY) {
      return res.status(500).json({ 
        success: false, 
        message: 'VAPID keys no configuradas' 
      });
    }

    res.json({
      success: true,
      publicKey: VAPID_PUBLIC_KEY
    });
  } catch (error) {
    console.error('❌ Error al obtener VAPID public key:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener clave pública',
      error: error.message 
    });
  }
};

/**
 * Suscribir usuario a push notifications
 */
export const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.userId;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ 
        success: false, 
        message: 'Suscripción inválida' 
      });
    }

    // Verificar si ya existe una suscripción para este usuario
    const existingQuery = `
      SELECT id FROM push_subscriptions 
      WHERE usuario_id = $1 AND endpoint = $2
    `;
    const existingResult = await query(existingQuery, [userId, subscription.endpoint]);

    if (existingResult.rows.length > 0) {
      // Actualizar suscripción existente
      const updateQuery = `
        UPDATE push_subscriptions 
        SET 
          p256dh = $1,
          auth = $2,
          updated_at = NOW()
        WHERE usuario_id = $3 AND endpoint = $4
        RETURNING *
      `;
      
      const result = await query(updateQuery, [
        subscription.keys.p256dh,
        subscription.keys.auth,
        userId,
        subscription.endpoint
      ]);

      console.log(`✅ Suscripción actualizada para usuario ${userId}`);
      
      return res.json({
        success: true,
        message: 'Suscripción actualizada exitosamente',
        subscription: result.rows[0]
      });
    }

    // Insertar nueva suscripción
    const insertQuery = `
      INSERT INTO push_subscriptions (usuario_id, endpoint, p256dh, auth)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await query(insertQuery, [
      userId,
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth
    ]);

    console.log(`✅ Nueva suscripción creada para usuario ${userId}`);

    res.json({
      success: true,
      message: 'Suscripción creada exitosamente',
      subscription: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error al suscribir a push notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear suscripción',
      error: error.message 
    });
  }
};

/**
 * Desuscribir usuario de push notifications
 */
export const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    const userId = req.userId;

    if (!endpoint) {
      return res.status(400).json({ 
        success: false, 
        message: 'Endpoint requerido' 
      });
    }

    const deleteQuery = `
      DELETE FROM push_subscriptions 
      WHERE usuario_id = $1 AND endpoint = $2
      RETURNING *
    `;
    
    const result = await query(deleteQuery, [userId, endpoint]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Suscripción no encontrada' 
      });
    }

    console.log(`✅ Suscripción eliminada para usuario ${userId}`);

    res.json({
      success: true,
      message: 'Desuscripción exitosa'
    });
  } catch (error) {
    console.error('❌ Error al desuscribir de push notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar suscripción',
      error: error.message 
    });
  }
};

/**
 * Obtener todas las suscripciones de un usuario
 */
export const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.userId;

    const selectQuery = `
      SELECT id, endpoint, created_at, updated_at 
      FROM push_subscriptions 
      WHERE usuario_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await query(selectQuery, [userId]);

    res.json({
      success: true,
      subscriptions: result.rows
    });
  } catch (error) {
    console.error('❌ Error al obtener suscripciones:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener suscripciones',
      error: error.message 
    });
  }
};

/**
 * Enviar push notification a un usuario específico
 */
export const sendPushToUser = async (userId, payload) => {
  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.warn('⚠️ VAPID keys no configuradas. No se puede enviar push.');
      return { success: false, sent: 0 };
    }

    // Obtener todas las suscripciones del usuario
    const selectQuery = `
      SELECT id, endpoint, p256dh, auth 
      FROM push_subscriptions 
      WHERE usuario_id = $1
    `;
    
    const result = await query(selectQuery, [userId]);

    if (result.rows.length === 0) {
      console.log(`ℹ️ No hay suscripciones para usuario ${userId}`);
      return { success: true, sent: 0 };
    }

    let successCount = 0;
    let failedSubscriptions = [];

    // Enviar notificación a cada suscripción
    for (const sub of result.rows) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload),
          {
            TTL: 86400, // 24 horas
            urgency: 'high'
          }
        );

        successCount++;
        console.log(`✅ Push enviado exitosamente a suscripción ${sub.id}`);
      } catch (error) {
        console.error(`❌ Error al enviar push a suscripción ${sub.id}:`, error.message);
        
        // Si la suscripción expiró o es inválida (410 Gone), eliminarla
        if (error.statusCode === 410 || error.statusCode === 404) {
          failedSubscriptions.push(sub.id);
        }
      }
    }

    // Eliminar suscripciones inválidas
    if (failedSubscriptions.length > 0) {
      const deleteInvalidQuery = `
        DELETE FROM push_subscriptions 
        WHERE id = ANY($1)
      `;
      await query(deleteInvalidQuery, [failedSubscriptions]);
      console.log(`🗑️ ${failedSubscriptions.length} suscripciones inválidas eliminadas`);
    }

    return {
      success: true,
      sent: successCount,
      failed: failedSubscriptions.length
    };
  } catch (error) {
    console.error('❌ Error al enviar push notification:', error);
    return { success: false, sent: 0, error: error.message };
  }
};

/**
 * Enviar push notification a múltiples usuarios
 */
export const sendPushToUsers = async (userIds, payload) => {
  try {
    const results = await Promise.all(
      userIds.map(userId => sendPushToUser(userId, payload))
    );

    const totalSent = results.reduce((sum, r) => sum + (r.sent || 0), 0);
    
    return {
      success: true,
      totalSent,
      results
    };
  } catch (error) {
    console.error('❌ Error al enviar push a múltiples usuarios:', error);
    return { success: false, totalSent: 0, error: error.message };
  }
};

/**
 * Enviar push notification de prueba (admin only)
 */
export const sendTestPush = async (req, res) => {
  try {
    const userId = req.userId;

    const payload = {
      title: '🎉 Prueba de Push Notification',
      body: 'Si ves esto, las notificaciones push están funcionando correctamente!',
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      tag: 'test-notification',
      requireInteraction: false,
      data: {
        url: '/dashboard',
        timestamp: Date.now()
      }
    };

    const result = await sendPushToUser(userId, payload);

    if (result.sent > 0) {
      res.json({
        success: true,
        message: 'Notificación de prueba enviada',
        sent: result.sent
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'No se pudo enviar la notificación. Verifica que estés suscrito.',
        sent: 0
      });
    }
  } catch (error) {
    console.error('❌ Error al enviar push de prueba:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al enviar notificación de prueba',
      error: error.message 
    });
  }
};

