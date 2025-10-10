import { query } from '../config/database.js';

// Obtener todas las configuraciones
export const getAllSettings = async (req, res) => {
  try {
    console.log('🔍 Obteniendo configuración del sistema...');
    
    // Obtener el primer (y único) registro de configuración
    const result = await query(
      'SELECT * FROM configuracion_sistema LIMIT 1'
    );

    console.log('📊 Registros encontrados:', result.rows.length);

    if (result.rows.length === 0) {
      console.log('⚠️ No hay configuración, creando por defecto...');
      // Si no existe, crear configuración por defecto
      const defaultConfig = await query(
        `INSERT INTO configuracion_sistema (
          nombre_proyecto, color_primario, color_secundario, 
          descripcion_proyecto, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
        ['Vanguard Calendar', '#667eea', '#764ba2', 'Sistema moderno de calendario educativo']
      );
      console.log('✅ Configuración por defecto creada');
      return res.json({
        success: true,
        settings: defaultConfig.rows[0]
      });
    }

    console.log('✅ Configuración encontrada:', result.rows[0].nombre_proyecto);
    res.json({
      success: true,
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error al obtener configuraciones:', error);
    console.error('📝 Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuraciones',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar configuración general
export const updateSettings = async (req, res) => {
  try {
    const {
      nombre_proyecto,
      color_primario,
      color_secundario,
      email_sistema,
      telefono_sistema,
      direccion_sistema,
      descripcion_proyecto
    } = req.body;

    // Verificar si existe configuración
    const exists = await query('SELECT id FROM configuracion_sistema LIMIT 1');

    let result;
    if (exists.rows.length > 0) {
      // Actualizar
      result = await query(
        `UPDATE configuracion_sistema SET 
          nombre_proyecto = COALESCE($1, nombre_proyecto),
          color_primario = COALESCE($2, color_primario),
          color_secundario = COALESCE($3, color_secundario),
          email_sistema = COALESCE($4, email_sistema),
          telefono_sistema = COALESCE($5, telefono_sistema),
          direccion_sistema = COALESCE($6, direccion_sistema),
          descripcion_proyecto = COALESCE($7, descripcion_proyecto),
          updated_at = NOW()
         WHERE id = $8
         RETURNING *`,
        [nombre_proyecto, color_primario, color_secundario, email_sistema, 
         telefono_sistema, direccion_sistema, descripcion_proyecto, exists.rows[0].id]
      );
    } else {
      // Crear
      result = await query(
        `INSERT INTO configuracion_sistema (
          nombre_proyecto, color_primario, color_secundario, 
          email_sistema, telefono_sistema, direccion_sistema, 
          descripcion_proyecto, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
        RETURNING *`,
        [nombre_proyecto, color_primario, color_secundario, email_sistema,
         telefono_sistema, direccion_sistema, descripcion_proyecto]
      );
    }

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente',
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración'
    });
  }
};

// Subir logo principal
export const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ninguna imagen'
      });
    }

    const logoUrl = `/uploads/${req.file.filename}`;

    // Obtener ID de configuración
    const config = await query('SELECT id FROM configuracion_sistema LIMIT 1');
    
    if (config.rows.length > 0) {
      await query(
        'UPDATE configuracion_sistema SET logo = $1, updated_at = NOW() WHERE id = $2',
        [logoUrl, config.rows[0].id]
      );
    }

    res.json({
      success: true,
      message: 'Logo actualizado exitosamente',
      logoUrl: logoUrl
    });
  } catch (error) {
    console.error('Error al subir logo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir logo'
    });
  }
};

// Subir favicon
export const uploadFavicon = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ninguna imagen'
      });
    }

    const faviconUrl = `/uploads/${req.file.filename}`;

    const config = await query('SELECT id FROM configuracion_sistema LIMIT 1');
    
    if (config.rows.length > 0) {
      await query(
        'UPDATE configuracion_sistema SET logo_favicon = $1, updated_at = NOW() WHERE id = $2',
        [faviconUrl, config.rows[0].id]
      );
    }

    res.json({
      success: true,
      message: 'Favicon actualizado exitosamente',
      faviconUrl: faviconUrl
    });
  } catch (error) {
    console.error('Error al subir favicon:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir favicon'
    });
  }
};

