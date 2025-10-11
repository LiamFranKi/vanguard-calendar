import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configurar transporter de email
let transporter = null;

export const getEmailTransporter = () => {
  if (transporter) {
    return transporter;
  }

  // Verificar si está configurado
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️ Email no configurado. Agrega EMAIL_HOST, EMAIL_USER, EMAIL_PASS en .env');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true para port 465, false para otros
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Verificar conexión
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Error al conectar con servidor de email:', error.message);
    } else {
      console.log('✅ Servidor de email listo para enviar mensajes');
    }
  });

  return transporter;
};

/**
 * Obtener configuración del sistema para emails
 */
export const getSystemConfig = async () => {
  try {
    const { query } = await import('../config/database.js');
    const result = await query('SELECT nombre_proyecto, logo, email_sistema FROM configuracion_sistema LIMIT 1');
    
    return {
      nombre_proyecto: result.rows[0]?.nombre_proyecto || 'Vanguard Calendar',
      logo: result.rows[0]?.logo || null,
      email_sistema: result.rows[0]?.email_sistema || process.env.EMAIL_USER
    };
  } catch (error) {
    console.error('Error al obtener config:', error);
    return {
      nombre_proyecto: 'Vanguard Calendar',
      logo: null,
      email_sistema: process.env.EMAIL_USER
    };
  }
};

