import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const ConfigContext = createContext();

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig debe ser usado dentro de ConfigProvider');
  }
  return context;
};

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({
    nombre_proyecto: 'Vanguard Calendar',
    color_primario: '#667eea',
    color_secundario: '#764ba2',
    descripcion_proyecto: 'Sistema moderno de gestión de calendario educativo',
    logo: null,
    logo_favicon: null,
    email_sistema: '',
    telefono_sistema: '',
    direccion_sistema: ''
  });
  const [loading, setLoading] = useState(true);
  const [configLoaded, setConfigLoaded] = useState(false);

  const fetchConfig = async () => {
    // Evitar llamadas duplicadas
    if (configLoaded) {
      console.log('⏭️ Configuración ya cargada, omitiendo...');
      return;
    }

    try {
      console.log('🔄 Cargando configuración...');
      setConfigLoaded(true);
      
      // Crear instancia de axios sin headers de autorización para llamadas públicas
      const publicAxios = axios.create();
      
      const response = await publicAxios.get('/api/config');
      console.log('📡 Respuesta del servidor:', response.data);
      
      if (response.data.success) {
        setConfig(response.data.settings);
        console.log('✅ Configuración cargada exitosamente');
      } else {
        console.warn('⚠️ Respuesta sin success, usando valores por defecto');
      }
    } catch (error) {
      console.error('❌ Error al cargar configuración:', error);
      console.error('📊 Status:', error.response?.status);
      console.error('📝 Response:', error.response?.data);
      
      // Usar valores por defecto si hay error
      console.log('🔧 Usando configuración por defecto');
      setConfig({
        nombre_proyecto: 'Vanguard Calendar',
        color_primario: '#667eea',
        color_secundario: '#764ba2',
        descripcion_proyecto: 'Sistema moderno de gestión de calendario educativo',
        logo: null,
        logo_favicon: null,
        email_sistema: '',
        telefono_sistema: '',
        direccion_sistema: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (newConfig) => {
    try {
      const response = await axios.put('/api/config', newConfig);
      if (response.data.success) {
        setConfig(response.data.settings);
        return { success: true };
      }
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al actualizar configuración' 
      };
    }
  };

  const forceReloadConfig = async () => {
    setConfigLoaded(false);
    await fetchConfig();
  };

  const uploadLogo = async (file) => {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await axios.post('/api/config/upload/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        setConfig(prev => ({ ...prev, logo: response.data.logoUrl }));
        return { success: true };
      }
    } catch (error) {
      console.error('Error al subir logo:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al subir logo' 
      };
    }
  };

  const uploadFavicon = async (file) => {
    try {
      const formData = new FormData();
      formData.append('favicon', file);
      
      const response = await axios.post('/api/config/upload/favicon', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        setConfig(prev => ({ ...prev, logo_favicon: response.data.faviconUrl }));
        
        // Actualizar favicon en el navegador
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = `http://localhost:5000/favicon.ico?t=${Date.now()}`;
        document.getElementsByTagName('head')[0].appendChild(link);
        
        return { success: true };
      }
    } catch (error) {
      console.error('Error al subir favicon:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al subir favicon' 
      };
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const value = {
    config,
    loading,
    fetchConfig,
    forceReloadConfig,
    updateConfig,
    uploadLogo,
    uploadFavicon
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};
