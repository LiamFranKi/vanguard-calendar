import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Backup Simple de Base de Datos PostgreSQL');
console.log('==========================================\n');

// Configuración de la base de datos (ajusta estos valores según tu configuración)
const dbConfig = {
  host: 'localhost',
  port: '5432',
  database: 'sistema_agenda',
  user: 'postgres',
  password: 'tu_password_aqui' // Cambia esto por tu contraseña real
};

// Crear directorio de backup
const backupDir = path.join(__dirname, '../../backup-database');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log('✅ Directorio de backup creado');
}

// Timestamp para el nombre del archivo
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupFile = path.join(backupDir, `sistema_agenda_completo_${timestamp}.sql`);

console.log('📊 Configuración:');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Puerto: ${dbConfig.port}`);
console.log(`   Base de datos: ${dbConfig.database}`);
console.log(`   Usuario: ${dbConfig.user}`);
console.log(`   Archivo: ${backupFile}\n`);

// Comando pg_dump
const pgDumpCommand = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} --verbose --clean --create --if-exists --no-owner --no-privileges --format=plain --file="${backupFile}"`;

console.log('🔄 Ejecutando pg_dump...');
console.log('   Comando:', pgDumpCommand.replace(dbConfig.password, '***'));

try {
  // Configurar variable de entorno para la contraseña
  const env = {
    ...process.env,
    PGPASSWORD: dbConfig.password
  };

  const { stdout, stderr } = await execAsync(pgDumpCommand, { env });

  if (stderr && !stderr.includes('pg_dump: last built-in OID is')) {
    console.warn('⚠️ Advertencias:', stderr);
  }

  // Verificar que el archivo se creó
  if (fs.existsSync(backupFile)) {
    const stats = fs.statSync(backupFile);
    const fileSizeKB = Math.round(stats.size / 1024);
    
    console.log('\n✅ Backup completado exitosamente!');
    console.log(`📁 Archivo: ${backupFile}`);
    console.log(`📊 Tamaño: ${fileSizeKB} KB`);
    
    // Mostrar estadísticas del archivo
    const content = fs.readFileSync(backupFile, 'utf8');
    const lines = content.split('\n');
    
    const tableCount = (content.match(/CREATE TABLE/g) || []).length;
    const insertCount = (content.match(/INSERT INTO/g) || []).length;
    
    console.log(`\n📊 Estadísticas:`);
    console.log(`   - Tablas: ${tableCount}`);
    console.log(`   - Inserts: ${insertCount}`);
    console.log(`   - Líneas: ${lines.length}`);
    
  } else {
    throw new Error('El archivo de backup no se creó');
  }

} catch (error) {
  console.error('\n❌ Error:', error.message);
  
  if (error.message.includes('pg_dump: command not found')) {
    console.log('\n💡 Soluciones:');
    console.log('   1. Instala PostgreSQL client tools');
    console.log('   2. O agrega pg_dump al PATH del sistema');
    console.log('   3. O usa la versión completa de PostgreSQL');
  } else if (error.message.includes('password authentication failed')) {
    console.log('\n💡 Verifica la contraseña en el script');
  } else if (error.message.includes('could not connect to server')) {
    console.log('\n💡 Verifica que PostgreSQL esté ejecutándose');
  }
}

console.log('\n🎉 Proceso finalizado!');
