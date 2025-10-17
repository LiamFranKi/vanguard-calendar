// Configuración para producción
export const SERVER_URL = 'https://calendar.vanguardschools.edu.pe';
export const API_URL = 'https://calendar.vanguardschools.edu.pe/api';

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