import { query } from '../config/database.js';

const checkAttachmentsTable = async () => {
  try {
    // Verificar que la tabla existe
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'task_attachments'
      );
    `);
    
    console.log('✅ Tabla task_attachments existe:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Verificar estructura de la tabla
      const structureCheck = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'task_attachments'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Estructura de la tabla:');
      structureCheck.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Verificar si hay datos
      const countCheck = await query('SELECT COUNT(*) as total FROM task_attachments');
      console.log('📊 Total de adjuntos:', countCheck.rows[0].total);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkAttachmentsTable();
