import { query } from '../config/database.js';

async function updateColors() {
  try {
    // Cambiar color secundario de naranja a morado
    await query('UPDATE configuracion_sistema SET color_secundario = $1', ['#764ba2']);
    console.log('✅ Color secundario cambiado a morado');
    
    // Verificar los colores actuales
    const result = await query('SELECT color_primario, color_secundario FROM configuracion_sistema LIMIT 1');
    console.log('🎨 Colores actuales:');
    console.log('   Primario:', result.rows[0].color_primario);
    console.log('   Secundario:', result.rows[0].color_secundario);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateColors();
