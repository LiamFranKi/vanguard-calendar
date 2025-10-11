import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde backend/.env
const envPath = join(__dirname, '../backend/.env');
dotenv.config({ path: envPath });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('\n🚀 Ejecutando migración 014: Push Subscriptions...\n');
    
    // Leer el archivo SQL
    const sqlPath = join(__dirname, '014_CREATE_PUSH_SUBSCRIPTIONS.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    // Ejecutar el SQL
    await client.query(sql);
    
    console.log('✅ Migración ejecutada exitosamente');
    console.log('📊 Tabla push_subscriptions creada');
    console.log('🔔 Sistema de Push Notifications listo\n');
    
  } catch (error) {
    console.error('❌ Error al ejecutar migración:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
