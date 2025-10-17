import { query } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando test de exportación...');

try {
  // Crear directorio de backup
  const backupDir = path.join(__dirname, '../../backup-database');
  console.log(`📁 Directorio: ${backupDir}`);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log('✅ Directorio creado');
  }

  // Test de conexión
  console.log('🔍 Probando conexión...');
  const testResult = await query('SELECT NOW() as current_time');
  console.log('✅ Conexión exitosa:', testResult.rows[0].current_time);

  // Obtener tablas
  console.log('📊 Obteniendo tablas...');
  const tablesResult = await query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  console.log(`✅ Encontradas ${tablesResult.rows.length} tablas:`);
  tablesResult.rows.forEach(row => {
    console.log(`   - ${row.table_name}`);
  });

  // Crear archivo de prueba
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const testFile = path.join(backupDir, `test_${timestamp}.sql`);
  
  let content = `-- Test de exportación\n`;
  content += `-- Fecha: ${new Date().toLocaleString()}\n`;
  content += `-- Tablas encontradas: ${tablesResult.rows.length}\n\n`;
  
  for (const table of tablesResult.rows) {
    content += `-- Tabla: ${table.table_name}\n`;
    
    // Obtener datos de la tabla
    const dataResult = await query(`SELECT COUNT(*) as count FROM "${table.table_name}"`);
    content += `-- Registros: ${dataResult.rows[0].count}\n`;
  }

  fs.writeFileSync(testFile, content, 'utf8');
  console.log(`✅ Archivo de prueba creado: ${testFile}`);

  const stats = fs.statSync(testFile);
  console.log(`📊 Tamaño: ${Math.round(stats.size / 1024)} KB`);

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}
