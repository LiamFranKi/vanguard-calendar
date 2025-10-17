import { query } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Backup Manual de Base de Datos');
console.log('================================\n');

const backupManual = async () => {
  try {
    // Crear directorio de backup
    const backupDir = path.join(__dirname, '../../backup-database');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFile = path.join(backupDir, `sistema_agenda_manual_${timestamp}.sql`);

    console.log(`📁 Archivo: ${backupFile}`);

    let sqlContent = '';
    
    // Header
    sqlContent += `-- ================================================\n`;
    sqlContent += `-- BACKUP MANUAL - SISTEMA AGENDA CALENDARIO\n`;
    sqlContent += `-- Fecha: ${new Date().toLocaleString('es-ES')}\n`;
    sqlContent += `-- ================================================\n\n`;

    sqlContent += `SET timezone = 'America/Lima';\n\n`;

    // 1. Obtener todas las tablas
    console.log('📊 Obteniendo tablas...');
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`✅ Encontradas ${tables.length} tablas`);

    // 2. Para cada tabla, obtener estructura y datos
    for (const tableName of tables) {
      console.log(`   Procesando: ${tableName}`);
      
      sqlContent += `-- ================================================\n`;
      sqlContent += `-- TABLA: ${tableName.toUpperCase()}\n`;
      sqlContent += `-- ================================================\n\n`;

      // Obtener estructura
      const structureResult = await query(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default,
          ordinal_position
        FROM information_schema.columns 
        WHERE table_name = $1 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `, [tableName]);

      // Crear tabla
      sqlContent += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
      sqlContent += `CREATE TABLE "${tableName}" (\n`;

      const columns = [];
      for (const col of structureResult.rows) {
        let columnDef = `  "${col.column_name}" ${col.data_type}`;
        
        if (col.character_maximum_length) {
          columnDef += `(${col.character_maximum_length})`;
        }
        
        if (col.is_nullable === 'NO') {
          columnDef += ' NOT NULL';
        }
        
        if (col.column_default) {
          columnDef += ` DEFAULT ${col.column_default}`;
        }
        
        columns.push(columnDef);
      }
      
      sqlContent += columns.join(',\n') + '\n);\n\n';

      // Obtener constraints
      const constraintsResult = await query(`
        SELECT 
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.constraint_column_usage ccu 
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = $1
        ORDER BY tc.constraint_type, tc.constraint_name;
      `, [tableName]);

      for (const constraint of constraintsResult.rows) {
        if (constraint.constraint_type === 'PRIMARY KEY') {
          sqlContent += `ALTER TABLE "${tableName}" ADD CONSTRAINT "${constraint.constraint_name}" PRIMARY KEY ("${constraint.column_name}");\n`;
        } else if (constraint.constraint_type === 'FOREIGN KEY') {
          sqlContent += `ALTER TABLE "${tableName}" ADD CONSTRAINT "${constraint.constraint_name}" FOREIGN KEY ("${constraint.column_name}") REFERENCES "${constraint.foreign_table_name}" ("${constraint.foreign_column_name}");\n`;
        } else if (constraint.constraint_type === 'UNIQUE') {
          sqlContent += `ALTER TABLE "${tableName}" ADD CONSTRAINT "${constraint.constraint_name}" UNIQUE ("${constraint.column_name}");\n`;
        }
      }
      sqlContent += '\n';

      // Obtener datos
      const dataResult = await query(`SELECT * FROM "${tableName}" ORDER BY 1;`);
      
      if (dataResult.rows.length > 0) {
        sqlContent += `-- Datos de ${tableName}\n`;
        
        const columns = Object.keys(dataResult.rows[0]);
        const columnNames = columns.map(col => `"${col}"`).join(', ');
        
        sqlContent += `INSERT INTO "${tableName}" (${columnNames}) VALUES\n`;

        const values = [];
        for (const row of dataResult.rows) {
          const rowValues = columns.map(col => {
            const value = row[col];
            if (value === null) return 'NULL';
            if (typeof value === 'string') {
              return `'${value.replace(/'/g, "''")}'`;
            }
            if (value instanceof Date) {
              return `'${value.toISOString()}'`;
            }
            if (typeof value === 'boolean') {
              return value ? 'TRUE' : 'FALSE';
            }
            return value;
          });
          values.push(`(${rowValues.join(', ')})`);
        }
        
        sqlContent += values.join(',\n') + ';\n\n';
      }
    }

    // Footer
    sqlContent += `-- ================================================\n`;
    sqlContent += `-- FIN DEL BACKUP MANUAL\n`;
    sqlContent += `-- ================================================\n`;

    // Escribir archivo
    fs.writeFileSync(backupFile, sqlContent, 'utf8');

    // Estadísticas
    const stats = fs.statSync(backupFile);
    const fileSizeKB = Math.round(stats.size / 1024);
    const lines = sqlContent.split('\n').length;

    console.log('\n✅ Backup manual completado!');
    console.log(`📁 Archivo: ${backupFile}`);
    console.log(`📊 Tamaño: ${fileSizeKB} KB`);
    console.log(`📋 Líneas: ${lines}`);
    console.log(`📊 Tablas: ${tables.length}`);

    return {
      success: true,
      file: backupFile,
      size: fileSizeKB,
      tables: tables.length,
      lines: lines
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
};

// Ejecutar
backupManual().then(result => {
  if (result.success) {
    console.log('\n🎉 Backup manual exitoso!');
  } else {
    console.log('\n❌ Error en backup manual');
  }
}).catch(console.error);
