import { query } from './config/database.js';

async function checkDB() {
  try {
    console.log('🔍 Verificando base de datos...\n');
    
    // Verificar tabla usuarios
    console.log('👥 Tabla usuarios:');
    const usuarios = await query('SELECT COUNT(*) FROM usuarios');
    console.log(`   Total usuarios: ${usuarios.rows[0].count}`);
    
    // Verificar tabla configuracion_sistema
    console.log('\n⚙️ Tabla configuracion_sistema:');
    const config = await query('SELECT * FROM configuracion_sistema LIMIT 1');
    if (config.rows.length > 0) {
      console.log(`   ✅ Existe configuración`);
      console.log(`   Nombre: ${config.rows[0].nombre_proyecto}`);
      console.log(`   Color primario: ${config.rows[0].color_primario}`);
      console.log(`   Color secundario: ${config.rows[0].color_secundario}`);
    } else {
      console.log('   ⚠️ No hay configuración, creando...');
      const newConfig = await query(`
        INSERT INTO configuracion_sistema (
          nombre_proyecto, color_primario, color_secundario, 
          descripcion_proyecto
        ) VALUES ($1, $2, $3, $4) RETURNING *
      `, ['Vanguard Calendar', '#667eea', '#764ba2', 'Sistema moderno de gestión de calendario']);
      console.log('   ✅ Configuración creada');
    }
    
    // Verificar tabla tareas
    console.log('\n📋 Tabla tareas:');
    const tareas = await query('SELECT COUNT(*) FROM tareas');
    console.log(`   Total tareas: ${tareas.rows[0].count}`);
    
    // Verificar tabla projects
    console.log('\n📁 Tabla projects:');
    const projects = await query('SELECT COUNT(*) FROM projects');
    console.log(`   Total proyectos: ${projects.rows[0].count}`);
    
    // Verificar tabla task_templates
    console.log('\n📄 Tabla task_templates:');
    const templates = await query('SELECT COUNT(*) FROM task_templates');
    console.log(`   Total templates: ${templates.rows[0].count}`);
    
    console.log('\n✅ Verificación completada!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkDB();
