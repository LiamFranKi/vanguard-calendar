import bcrypt from 'bcrypt';
import { query } from '../config/database.js';

// Listar todos los usuarios
export const getAllUsers = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, dni, nombres, apellidos, email, telefono, rol, activo, avatar, 
              ultimo_acceso, created_at, updated_at 
       FROM usuarios 
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      users: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios'
    });
  }
};

// Obtener usuario por ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT id, dni, nombres, apellidos, email, telefono, rol, activo, avatar, 
              ultimo_acceso, created_at, updated_at 
       FROM usuarios 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario'
    });
  }
};

// Crear nuevo usuario
export const createUser = async (req, res) => {
  try {
    const { dni, nombres, apellidos, email, telefono, clave, rol } = req.body;

    // Verificar si el DNI ya existe
    const existingDni = await query(
      'SELECT id FROM usuarios WHERE dni = $1',
      [dni]
    );

    if (existingDni.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El DNI ya está registrado'
      });
    }

    // Verificar si el email ya existe
    if (email) {
      const existingEmail = await query(
        'SELECT id FROM usuarios WHERE email = $1',
        [email]
      );

      if (existingEmail.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(clave, 10);

    // Avatar si se proporcionó
    const avatarUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Crear usuario
    const result = await query(
      `INSERT INTO usuarios (dni, nombres, apellidos, email, telefono, clave, rol, activo, avatar, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, NOW(), NOW()) 
       RETURNING id, dni, nombres, apellidos, email, telefono, rol, activo, avatar, created_at`,
      [dni, nombres, apellidos, email || null, telefono || null, hashedPassword, rol, avatarUrl]
    );

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario'
    });
  }
};

// Actualizar usuario
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { dni, nombres, apellidos, email, telefono, rol, activo, clave } = req.body;

    // Verificar si el usuario existe
    const userExists = await query(
      'SELECT id FROM usuarios WHERE id = $1',
      [id]
    );

    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar si el DNI ya existe en otro usuario
    if (dni) {
      const existingDni = await query(
        'SELECT id FROM usuarios WHERE dni = $1 AND id != $2',
        [dni, id]
      );

      if (existingDni.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El DNI ya está registrado en otro usuario'
        });
      }
    }

    // Verificar si el email ya existe en otro usuario
    if (email) {
      const existingEmail = await query(
        'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
        [email, id]
      );

      if (existingEmail.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado en otro usuario'
        });
      }
    }

    // Avatar si se proporcionó
    const avatarUrl = req.file ? `/uploads/${req.file.filename}` : null;

    let updateQuery = `UPDATE usuarios SET 
      dni = COALESCE($1, dni),
      nombres = COALESCE($2, nombres),
      apellidos = COALESCE($3, apellidos),
      email = COALESCE($4, email),
      telefono = COALESCE($5, telefono),
      rol = COALESCE($6, rol),
      activo = COALESCE($7, activo)`;

    let queryParams = [dni, nombres, apellidos, email, telefono, rol, activo];

    // Si se proporcionó avatar
    if (avatarUrl) {
      updateQuery += `, avatar = $${queryParams.length + 1}`;
      queryParams.push(avatarUrl);
    }

    updateQuery += `, updated_at = NOW()`;

    // Si se proporciona una nueva contraseña, hashearla y actualizar
    if (clave) {
      const hashedPassword = await bcrypt.hash(clave, 10);
      updateQuery += `, clave = $${queryParams.length + 1}`;
      queryParams.push(hashedPassword);
    }

    updateQuery += ` WHERE id = $${queryParams.length + 1}`;
    queryParams.push(id);

    updateQuery += ` RETURNING id, dni, nombres, apellidos, email, telefono, rol, activo, avatar, updated_at`;

    const result = await query(updateQuery, queryParams);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario'
    });
  }
};

// Eliminar usuario
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el usuario existe
    const userExists = await query(
      'SELECT id, dni FROM usuarios WHERE id = $1',
      [id]
    );

    if (userExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // No permitir eliminar al usuario actual
    if (parseInt(id) === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propio usuario'
      });
    }

    await query('DELETE FROM usuarios WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario'
    });
  }
};

// Cambiar estado activo/inactivo
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE usuarios SET activo = NOT activo, updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, dni, nombres, apellidos, activo`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: `Usuario ${result.rows[0].activo ? 'activado' : 'desactivado'} exitosamente`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del usuario'
    });
  }
};

