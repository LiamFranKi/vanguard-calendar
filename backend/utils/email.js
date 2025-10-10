import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configurar transporter
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verificar configuración (solo en desarrollo)
if (process.env.NODE_ENV === 'development' && process.env.EMAIL_USER) {
  transporter.verify((error) => {
    if (error) {
      console.log('❌ Error en configuración de email:', error);
    } else {
      console.log('✅ Servidor de email listo');
    }
  });
}

/**
 * Enviar email
 * @param {Object} options - Opciones del email
 * @param {string} options.to - Destinatario
 * @param {string} options.subject - Asunto
 * @param {string} options.html - Contenido HTML
 * @param {string} options.text - Contenido texto plano
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SYSTEM_NAME || 'Sistema Agenda'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });

    console.log('✅ Email enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Enviar email de bienvenida
 */
export const sendWelcomeEmail = async (user) => {
  const html = `
    <h1>¡Bienvenido a Sistema de Agenda!</h1>
    <p>Hola ${user.name},</p>
    <p>Tu cuenta ha sido creada exitosamente.</p>
    <p>Ya puedes acceder al sistema y comenzar a gestionar tu agenda.</p>
    <br>
    <p>Saludos,<br>Equipo de Sistema de Agenda</p>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Bienvenido al Sistema de Agenda',
    html,
    text: `Hola ${user.name}, tu cuenta ha sido creada exitosamente.`
  });
};

/**
 * Enviar recordatorio de evento
 */
export const sendEventReminder = async (user, event) => {
  const html = `
    <h2>Recordatorio de Evento</h2>
    <p>Hola ${user.name},</p>
    <p>Te recordamos que tienes el siguiente evento próximamente:</p>
    <h3>${event.title}</h3>
    <p><strong>Fecha:</strong> ${new Date(event.start_date).toLocaleString('es')}</p>
    ${event.location ? `<p><strong>Lugar:</strong> ${event.location}</p>` : ''}
    ${event.description ? `<p><strong>Descripción:</strong> ${event.description}</p>` : ''}
    <br>
    <p>Saludos,<br>Equipo de Sistema de Agenda</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Recordatorio: ${event.title}`,
    html,
    text: `Recordatorio: ${event.title} - ${new Date(event.start_date).toLocaleString('es')}`
  });
};

export default { sendEmail, sendWelcomeEmail, sendEventReminder };


