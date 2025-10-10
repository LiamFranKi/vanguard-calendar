import { query } from './config/database.js';

async function updateColors() {
  try {
    console.log('🎨 Actualizando colores de configuración...');
    
    const result = await query(`
      UPDATE configuracion_sistema 
      SET color_primario = $1, 
          color_secundario = $2,
          updated_at = NOW()
      WHERE id = (SELECT id FROM configuracion_sistema LIMIT 1)
      RETURNING *
    `, ['#667eea', '#764ba2']);
    
    console.log('✅ Colores actualizados:');
    console.log(`   Color primario: ${result.rows[0].color_primario}`);
    console.log(`   Color secundario: ${result.rows[0].color_secundario}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateColors();
