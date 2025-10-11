import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRol = decoded.rol;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    // Comparación case-insensitive
    const userRolLower = req.userRol ? req.userRol.toLowerCase() : '';
    const rolesLower = roles.map(r => r.toLowerCase());
    
    if (!rolesLower.includes(userRolLower)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }
    next();
  };
};


