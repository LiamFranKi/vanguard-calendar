import { getEmailTransporter, getSystemConfig } from '../config/email.js';
import { query } from '../config/database.js';

/**
 * Generar template HTML para emails
 */
const generateEmailTemplate = (config, titulo, mensaje, tipo, ctaText = null, ctaLink = null) => {
  const tipoColors = {
    'info': '#3b82f6',
    'success': '#22c55e',
    'warning': '#f59e0b',
    'error': '#ef4444'
  };

  const color = tipoColors[tipo] || '#3b82f6';
  // Para emails, usar una URL pública o base64 del logo
  // Por ahora, no mostrar logo en emails para evitar problemas de carga
  const logoUrl = ''; // Temporalmente deshabilitado

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <!-- Container principal -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header con logo y nombre -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 40px; text-align: center;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${config.nombre_proyecto}" style="height: 60px; margin-bottom: 15px;">` : ''}
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ${config.nombre_proyecto}
              </h1>
            </td>
          </tr>

          <!-- Icono y título de notificación -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <div style="width: 80px; height: 80px; margin: 0 auto 20px; background-color: ${color}15; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">
                  ${tipo === 'success' ? '✅' : tipo === 'warning' ? '⚠️' : tipo === 'error' ? '❌' : '🔔'}
                </span>
              </div>
              <h2 style="margin: 0; color: #1f2937; font-size: 24px; font-weight: 700;">
                ${titulo}
              </h2>
            </td>
          </tr>

          <!-- Mensaje -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center;">
                ${mensaje}
              </p>
            </td>
          </tr>

          <!-- Botón CTA (opcional) -->
          ${ctaText && ctaLink ? `
          <tr>
            <td style="padding: 0 40px 40px 40px; text-align: center;">
              <a href="${ctaLink}" style="display: inline-block; padding: 14px 32px; background-color: ${color}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                ${ctaText}
              </a>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                Este es un mensaje automático del sistema ${config.nombre_proyecto}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} ${config.nombre_proyecto}. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Enviar email de notificación
 */
export const sendNotificationEmail = async (userEmail, titulo, mensaje, tipo, relacionado_tipo = null, relacionado_id = null) => {
  try {
    const transporter = getEmailTransporter();
    
    if (!transporter) {
      console.log('⚠️ Email no enviado: transporter no configurado');
      return { success: false, message: 'Email no configurado' };
    }

    if (!userEmail) {
      console.log('⚠️ Email no enviado: usuario sin email');
      return { success: false, message: 'Usuario sin email' };
    }

    const config = await getSystemConfig();

    // Generar link al elemento relacionado
    let ctaText = null;
    let ctaLink = null;

    if (relacionado_tipo === 'tarea' && relacionado_id) {
      ctaText = 'Ver Tarea';
      ctaLink = `http://localhost:3000/tareas?openTask=${relacionado_id}`;
    } else if (relacionado_tipo === 'evento' && relacionado_id) {
      ctaText = 'Ver Evento';
      ctaLink = `http://localhost:3000/calendario`;
    }

    const htmlContent = generateEmailTemplate(config, titulo, mensaje, tipo, ctaText, ctaLink);

    const mailOptions = {
      from: `"${config.nombre_proyecto}" <${config.email_sistema}>`,
      to: userEmail,
      subject: titulo,
      html: htmlContent,
      text: mensaje // Versión texto plano
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email enviado a ${userEmail}: ${titulo}`);
    console.log(`📧 Message ID: ${info.messageId}`);

    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Error al enviar email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Enviar emails a múltiples usuarios
 */
export const sendBulkNotificationEmails = async (userIds, titulo, mensaje, tipo, relacionado_tipo = null, relacionado_id = null) => {
  try {
    // Obtener emails de los usuarios
    const usersQuery = await query(
      'SELECT id, email, nombres, apellidos FROM usuarios WHERE id = ANY($1) AND email IS NOT NULL',
      [userIds]
    );

    const users = usersQuery.rows;

    if (users.length === 0) {
      console.log('⚠️ No hay usuarios con email para notificar');
      return { success: false, sent: 0 };
    }

    let sentCount = 0;

    for (const user of users) {
      const result = await sendNotificationEmail(
        user.email,
        titulo,
        mensaje,
        tipo,
        relacionado_tipo,
        relacionado_id
      );

      if (result.success) {
        sentCount++;
        
        // Actualizar flag enviada_email en la notificación
        await query(`
          UPDATE notificaciones 
          SET enviada_email = true 
          WHERE usuario_id = $1 
            AND titulo = $2 
            AND relacionado_id = $3
            AND enviada_email = false
        `, [user.id, titulo, relacionado_id]);
      }
    }

    console.log(`📧 Emails enviados: ${sentCount}/${users.length}`);

    return { success: true, sent: sentCount, total: users.length };

  } catch (error) {
    console.error('❌ Error al enviar emails masivos:', error);
    return { success: false, error: error.message };
  }
};

