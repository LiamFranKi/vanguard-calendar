import { query } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const LOGO_BACKUP = '/uploads/logo-1760117680392-456794581.png';

async function restoreLogo() {
  try {
    console.log('🔄 Restaurando logo anterior...');
    console.log(`📂 Ruta: ${LOGO_BACKUP}`);
    
    const result = await query(
      'UPDATE configuracion_sistema SET logo = $1, updated_at = NOW() WHERE id = 1 RETURNING *',
      [LOGO_BACKUP]
    );
    
    if (result.rows.length > 0) {
      console.log('\n✅ Logo restaurado exitosamente!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🎯 Sistema: ${result.rows[0].nombre_proyecto}`);
      console.log(`📂 Logo: ${result.rows[0].logo}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n🔄 Recarga el navegador para ver el cambio');
    } else {
      console.log('❌ No se pudo restaurar el logo');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al restaurar logo:', error);
    process.exit(1);
  }
}

restoreLogo();

