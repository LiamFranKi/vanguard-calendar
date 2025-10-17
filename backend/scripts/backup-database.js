import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

const backupDatabase = async () => {
  try {
    console.log('🔄 Iniciando backup completo de la base de datos...');
    
    // Configuración de la base de datos
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'sistema_agenda',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD
    };

    if (!dbConfig.password) {
      throw new Error('❌ DB_PASSWORD no está configurado en el archivo .env');
    }

    // Crear directorio de backup si no existe
    const backupDir = path.join(__dirname, '../../backup-database');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Timestamp para el nombre del archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFile = path.join(backupDir, `sistema_agenda_completo_${timestamp}.sql`);

    console.log('📊 Configuración de la base de datos:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Puerto: ${dbConfig.port}`);
    console.log(`   Base de datos: ${dbConfig.database}`);
    console.log(`   Usuario: ${dbConfig.user}`);
    console.log(`   Archivo de backup: ${backupFile}`);

    // Comando pg_dump para backup completo
    const pgDumpCommand = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} --verbose --clean --create --if-exists --no-owner --no-privileges --format=plain --file="${backupFile}"`;

    console.log('🔄 Ejecutando pg_dump...');
    console.log('   Esto puede tomar unos minutos...');

    // Ejecutar el comando con la contraseña
    const env = {
      ...process.env,
      PGPASSWORD: dbConfig.password
    };

    const { stdout, stderr } = await execAsync(pgDumpCommand, { env });

    if (stderr && !stderr.includes('pg_dump: last built-in OID is')) {
      console.warn('⚠️ Advertencias durante el backup:', stderr);
    }

    // Verificar que el archivo se creó correctamente
    if (fs.existsSync(backupFile)) {
      const stats = fs.statSync(backupFile);
      const fileSizeKB = Math.round(stats.size / 1024);
      
      console.log('✅ Backup completado exitosamente!');
      console.log(`📁 Archivo creado: ${backupFile}`);
      console.log(`📊 Tamaño del archivo: ${fileSizeKB} KB`);
      
      // Mostrar las primeras líneas del archivo para verificar
      const content = fs.readFileSync(backupFile, 'utf8');
      const lines = content.split('\n');
      console.log('\n📋 Contenido del backup:');
      console.log('   - Estructura de tablas');
      console.log('   - Datos de todas las tablas');
      console.log('   - Funciones y procedimientos');
      console.log('   - Índices y constraints');
      console.log('   - Secuencias y triggers');
      
      // Contar líneas importantes
      const tableCount = (content.match(/CREATE TABLE/g) || []).length;
      const functionCount = (content.match(/CREATE FUNCTION/g) || []).length;
      const insertCount = (content.match(/INSERT INTO/g) || []).length;
      
      console.log(`\n📊 Estadísticas del backup:`);
      console.log(`   - Tablas: ${tableCount}`);
      console.log(`   - Funciones: ${functionCount}`);
      console.log(`   - Inserts de datos: ${insertCount}`);
      console.log(`   - Líneas totales: ${lines.length}`);
      
      return {
        success: true,
        file: backupFile,
        size: fileSizeKB,
        tables: tableCount,
        functions: functionCount,
        inserts: insertCount
      };
    } else {
      throw new Error('❌ El archivo de backup no se creó correctamente');
    }

  } catch (error) {
    console.error('❌ Error durante el backup:', error.message);
    
    if (error.message.includes('pg_dump: command not found')) {
      console.error('💡 Solución: Instala PostgreSQL client tools o agrega pg_dump al PATH');
    } else if (error.message.includes('password authentication failed')) {
      console.error('💡 Solución: Verifica la contraseña en el archivo .env');
    } else if (error.message.includes('could not connect to server')) {
      console.error('💡 Solución: Verifica que PostgreSQL esté ejecutándose y la configuración de conexión');
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

// Función para crear un backup simplificado (solo estructura y datos)
const createSimpleBackup = async () => {
  try {
    console.log('🔄 Creando backup simplificado...');
    
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'sistema_agenda',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD
    };

    const backupDir = path.join(__dirname, '../../backup-database');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFile = path.join(backupDir, `sistema_agenda_simple_${timestamp}.sql`);

    // Comando más simple sin --create
    const pgDumpCommand = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} --verbose --clean --no-owner --no-privileges --format=plain --file="${backupFile}"`;

    const env = {
      ...process.env,
      PGPASSWORD: dbConfig.password
    };

    await execAsync(pgDumpCommand, { env });

    if (fs.existsSync(backupFile)) {
      const stats = fs.statSync(backupFile);
      const fileSizeKB = Math.round(stats.size / 1024);
      
      console.log('✅ Backup simplificado completado!');
      console.log(`📁 Archivo: ${backupFile}`);
      console.log(`📊 Tamaño: ${fileSizeKB} KB`);
      
      return {
        success: true,
        file: backupFile,
        size: fileSizeKB
      };
    }
  } catch (error) {
    console.error('❌ Error en backup simplificado:', error.message);
    return { success: false, error: error.message };
  }
};

// Ejecutar el backup
const main = async () => {
  console.log('🚀 Sistema de Backup de Base de Datos');
  console.log('=====================================\n');

  // Intentar backup completo primero
  const result = await backupDatabase();
  
  if (!result.success) {
    console.log('\n🔄 Intentando backup simplificado...');
    const simpleResult = await createSimpleBackup();
    
    if (simpleResult.success) {
      console.log('✅ Backup simplificado exitoso!');
    } else {
      console.log('❌ Ambos métodos de backup fallaron');
      process.exit(1);
    }
  }

  console.log('\n🎉 Proceso de backup finalizado!');
  console.log('📁 Revisa la carpeta backup-database/ para los archivos generados');
};

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { backupDatabase, createSimpleBackup };
