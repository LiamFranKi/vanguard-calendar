import { query } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function backupCurrentLogo() {
  try {
    console.log('📸 Obteniendo logo actual de la base de datos...');
    
    const result = await query('SELECT logo, nombre_proyecto FROM configuracion_sistema LIMIT 1');
    
    if (result.rows.length > 0) {
      const config = result.rows[0];
      
      console.log('\n✅ LOGO ACTUAL GUARDADO:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📂 Ruta: ${config.logo || 'Sin logo configurado'}`);
      console.log(`🏷️  Sistema: ${config.nombre_proyecto}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Guardar en archivo de texto para referencia
      const fs = await import('fs');
      const backupData = {
        fecha_backup: new Date().toISOString(),
        logo_path: config.logo,
        nombre_proyecto: config.nombre_proyecto
      };
      
      fs.writeFileSync(
        './logo_backup.json', 
        JSON.stringify(backupData, null, 2)
      );
      
      console.log('\n💾 Backup guardado en: logo_backup.json');
      console.log('\n📝 INSTRUCCIONES PARA REVERTIR:');
      console.log('   Si quieres volver al logo anterior, ejecuta:');
      console.log('   node backend/scripts/restore-logo.js');
      console.log('');
      
    } else {
      console.log('❌ No se encontró configuración en la base de datos');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al obtener logo:', error);
    process.exit(1);
  }
}

backupCurrentLogo();

