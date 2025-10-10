import bcrypt from 'bcrypt';
import { query } from '../config/database.js';

// Obtener perfil del usuario actual
export const getMyProfile = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, dni, nombres, apellidos, email, telefono, rol, activo, avatar, 
              ultimo_acceso, created_at, updated_at 
       FROM usuarios 
       WHERE id = $1`,
      [req.userId]
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
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil'
    });
  }
};

// Actualizar perfil del usuario actual
export const updateMyProfile = async (req, res) => {
  try {
    const { nombres, apellidos, email, telefono, clave } = req.body;

    // Verificar si el email ya existe en otro usuario
    if (email) {
      const existingEmail = await query(
        'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
        [email, req.userId]
      );

      if (existingEmail.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado en otro usuario'
        });
      }
    }

    let updateQuery = `UPDATE usuarios SET 
      nombres = COALESCE($1, nombres),
      apellidos = COALESCE($2, apellidos),
      email = COALESCE($3, email),
      telefono = COALESCE($4, telefono),
      updated_at = NOW()`;

    let queryParams = [nombres, apellidos, email, telefono];

    // Si se proporciona una nueva contraseña, hashearla y actualizar
    if (clave) {
      const hashedPassword = await bcrypt.hash(clave, 10);
      updateQuery += `, clave = $5 WHERE id = $6`;
      queryParams.push(hashedPassword, req.userId);
    } else {
      updateQuery += ` WHERE id = $5`;
      queryParams.push(req.userId);
    }

    updateQuery += ` RETURNING id, dni, nombres, apellidos, email, telefono, rol, avatar, updated_at`;

    const result = await query(updateQuery, queryParams);

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil'
    });
  }
};

// Actualizar avatar
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ninguna imagen'
      });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    const result = await query(
      `UPDATE usuarios SET avatar = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, dni, nombres, apellidos, avatar`,
      [avatarUrl, req.userId]
    );

    res.json({
      success: true,
      message: 'Avatar actualizado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar avatar'
    });
  }
};

