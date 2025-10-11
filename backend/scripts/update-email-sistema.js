import { query } from '../config/database.js';

const updateEmailSistema = async () => {
  try {
    // Cambiar este email por el tuyo
    const emailSistema = 'walterlozanoalcalde@gmail.com';
    
    await query('UPDATE configuracion_sistema SET email_sistema = $1', [emailSistema]);
    
    console.log('✅ Email del sistema actualizado a:', emailSistema);
    console.log('📧 Los emails se enviarán desde:', emailSistema);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

updateEmailSistema();
