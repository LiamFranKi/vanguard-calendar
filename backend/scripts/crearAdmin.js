import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function crearAdmin() {
  try {
    const dni = '11111111';
    const clave = 'waltito10';
    const nombres = 'Administrador';
    const apellidos = 'Sistema';
    const email = 'admin@sistema.com';
    const rol = 'administrador';

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(clave, 10);

    console.log('🔐 Contraseña hasheada:', hashedPassword);

    // Insertar usuario administrador
    const result = await pool.query(
      `INSERT INTO usuarios (dni, nombres, apellidos, email, clave, rol, activo, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW()) 
       RETURNING id, dni, nombres, apellidos, email, rol`,
      [dni, nombres, apellidos, email, hashedPassword, rol]
    );

    console.log('\n✅ Usuario administrador creado exitosamente:');
    console.log(result.rows[0]);
    console.log('\n📝 Credenciales de acceso:');
    console.log(`DNI: ${dni}`);
    console.log(`Clave: ${clave}`);
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear administrador:', error.message);
    await pool.end();
    process.exit(1);
  }
}

crearAdmin();
