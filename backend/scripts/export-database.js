import { query, getClient } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const exportDatabase = async () => {
  try {
    console.log('🔄 Iniciando exportación completa de la base de datos...');
    console.log('🔍 Verificando conexión a la base de datos...');
    
    // Crear directorio de backup si no existe
    const backupDir = path.join(__dirname, '../../backup-database');
    console.log(`📁 Directorio de backup: ${backupDir}`);
    if (!fs.existsSync(backupDir)) {
      console.log('📁 Creando directorio de backup...');
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('✅ Directorio creado exitosamente');
    } else {
      console.log('✅ Directorio de backup ya existe');
    }

    // Timestamp para el nombre del archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFile = path.join(backupDir, `sistema_agenda_completo_${timestamp}.sql`);

    console.log(`📁 Archivo de backup: ${backupFile}`);

    let sqlContent = '';
    
    // Header del archivo SQL
    sqlContent += `-- ================================================\n`;
    sqlContent += `-- BACKUP COMPLETO DE SISTEMA AGENDA CALENDARIO\n`;
    sqlContent += `-- Fecha: ${new Date().toLocaleString('es-ES')}\n`;
    sqlContent += `-- ================================================\n\n`;

    // Configurar timezone
    sqlContent += `-- Configurar timezone\n`;
    sqlContent += `SET timezone = 'America/Lima';\n\n`;

    // 1. Obtener todas las tablas
    console.log('📊 Obteniendo estructura de tablas...');
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`   Encontradas ${tables.length} tablas: ${tables.join(', ')}`);

    // 2. Obtener estructura de cada tabla
    for (const tableName of tables) {
      console.log(`   Procesando tabla: ${tableName}`);
      
      // Obtener estructura de la tabla
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

      sqlContent += `-- ================================================\n`;
      sqlContent += `-- TABLA: ${tableName.toUpperCase()}\n`;
      sqlContent += `-- ================================================\n\n`;

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

      // Obtener constraints (primary keys, foreign keys, etc.)
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

      // Obtener índices
      const indexesResult = await query(`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = $1 
        AND schemaname = 'public'
        AND indexname NOT LIKE '%_pkey';
      `, [tableName]);

      for (const index of indexesResult.rows) {
        sqlContent += `${index.indexdef};\n`;
      }
      sqlContent += '\n';
    }

    // 3. Obtener secuencias
    console.log('📊 Obteniendo secuencias...');
    const sequencesResult = await query(`
      SELECT sequence_name, data_type, start_value, minimum_value, maximum_value, increment
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
      ORDER BY sequence_name;
    `);

    if (sequencesResult.rows.length > 0) {
      sqlContent += `-- ================================================\n`;
      sqlContent += `-- SECUENCIAS\n`;
      sqlContent += `-- ================================================\n\n`;

      for (const seq of sequencesResult.rows) {
        sqlContent += `CREATE SEQUENCE IF NOT EXISTS "${seq.sequence_name}"\n`;
        sqlContent += `  INCREMENT ${seq.increment}\n`;
        sqlContent += `  MINVALUE ${seq.minimum_value}\n`;
        sqlContent += `  MAXVALUE ${seq.maximum_value}\n`;
        sqlContent += `  START ${seq.start_value}\n`;
        sqlContent += `  CACHE 1;\n\n`;
      }
    }

    // 4. Obtener funciones
    console.log('📊 Obteniendo funciones...');
    const functionsResult = await query(`
      SELECT 
        routine_name,
        routine_definition
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
      ORDER BY routine_name;
    `);

    if (functionsResult.rows.length > 0) {
      sqlContent += `-- ================================================\n`;
      sqlContent += `-- FUNCIONES\n`;
      sqlContent += `-- ================================================\n\n`;

      for (const func of functionsResult.rows) {
        sqlContent += `-- Función: ${func.routine_name}\n`;
        sqlContent += `${func.routine_definition};\n\n`;
      }
    }

    // 5. Insertar datos
    console.log('📊 Exportando datos...');
    for (const tableName of tables) {
      console.log(`   Exportando datos de: ${tableName}`);
      
      const dataResult = await query(`SELECT * FROM "${tableName}" ORDER BY 1;`);
      
      if (dataResult.rows.length > 0) {
        sqlContent += `-- ================================================\n`;
        sqlContent += `-- DATOS DE LA TABLA: ${tableName.toUpperCase()}\n`;
        sqlContent += `-- ================================================\n\n`;

        // Obtener nombres de columnas
        const columns = Object.keys(dataResult.rows[0]);
        const columnNames = columns.map(col => `"${col}"`).join(', ');
        
        sqlContent += `INSERT INTO "${tableName}" (${columnNames}) VALUES\n`;

        const values = [];
        for (const row of dataResult.rows) {
          const rowValues = columns.map(col => {
            const value = row[col];
            if (value === null) return 'NULL';
            if (typeof value === 'string') {
              // Escapar comillas simples
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

    // 6. Actualizar secuencias
    if (sequencesResult.rows.length > 0) {
      sqlContent += `-- ================================================\n`;
      sqlContent += `-- ACTUALIZAR SECUENCIAS\n`;
      sqlContent += `-- ================================================\n\n`;

      for (const seq of sequencesResult.rows) {
        sqlContent += `SELECT setval('"${seq.sequence_name}"', (SELECT MAX(id) FROM "${seq.sequence_name.replace('_id_seq', '')}"));\n`;
      }
      sqlContent += '\n';
    }

    // Footer
    sqlContent += `-- ================================================\n`;
    sqlContent += `-- FIN DEL BACKUP\n`;
    sqlContent += `-- ================================================\n`;

    // Escribir archivo
    fs.writeFileSync(backupFile, sqlContent, 'utf8');

    // Estadísticas
    const stats = fs.statSync(backupFile);
    const fileSizeKB = Math.round(stats.size / 1024);
    const lines = sqlContent.split('\n').length;

    console.log('✅ Exportación completada exitosamente!');
    console.log(`📁 Archivo creado: ${backupFile}`);
    console.log(`📊 Tamaño del archivo: ${fileSizeKB} KB`);
    console.log(`📋 Líneas totales: ${lines}`);
    console.log(`📊 Tablas exportadas: ${tables.length}`);
    console.log(`📊 Secuencias: ${sequencesResult.rows.length}`);
    console.log(`📊 Funciones: ${functionsResult.rows.length}`);

    return {
      success: true,
      file: backupFile,
      size: fileSizeKB,
      tables: tables.length,
      sequences: sequencesResult.rows.length,
      functions: functionsResult.rows.length,
      lines: lines
    };

  } catch (error) {
    console.error('❌ Error durante la exportación:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Ejecutar la exportación
const main = async () => {
  console.log('🚀 Exportador de Base de Datos - Sistema Agenda Calendario');
  console.log('========================================================\n');

  const result = await exportDatabase();
  
  if (result.success) {
    console.log('\n🎉 Exportación completada exitosamente!');
    console.log('📁 Revisa la carpeta backup-database/ para el archivo generado');
  } else {
    console.log('\n❌ Error en la exportación');
    process.exit(1);
  }
};

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
} else {
  // Si se importa como módulo, ejecutar main
  main().catch(console.error);
}

export { exportDatabase };
