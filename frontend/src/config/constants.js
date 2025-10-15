// Configuración del servidor
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Función para obtener la URL completa de un endpoint
export const getServerUrl = (path = '') => {
  return `${SERVER_URL}${path}`;
};

// Función para obtener la URL de una imagen
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('data:')) return imagePath;
  if (imagePath.startsWith('http')) return imagePath;
  return `${SERVER_URL}${imagePath}`;
};
