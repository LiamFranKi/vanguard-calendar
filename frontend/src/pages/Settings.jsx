import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import axios from 'axios';
import Swal from 'sweetalert2';

function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre_proyecto: '',
    descripcion_proyecto: '',
    color_primario: '#667eea',
    color_secundario: '#764ba2',
    email_sistema: '',
    telefono_sistema: '',
    direccion_sistema: ''
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { config, updateConfig, uploadLogo, uploadFavicon, fetchConfig } = useConfig();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.rol !== 'administrador')) {
      navigate('/dashboard');
    } else if (!authLoading && config) {
      // Usar los datos del contexto en lugar de hacer llamada separada
      setFormData({
        nombre_proyecto: config.nombre_proyecto || '',
        descripcion_proyecto: config.descripcion_proyecto || '',
        color_primario: config.color_primario || '#667eea',
        color_secundario: config.color_secundario || '#764ba2',
        email_sistema: config.email_sistema || '',
        telefono_sistema: config.telefono_sistema || '',
        direccion_sistema: config.direccion_sistema || ''
      });
      setLogoPreview(config.logo);
      setLoading(false);
    }
  }, [isAuthenticated, user, navigate, config, authLoading]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Actualizar configuración general usando el contexto
      const result = await updateConfig(formData);
      if (!result.success) {
        throw new Error(result.message);
      }

      // Subir logo si hay uno nuevo
      if (logo) {
        const logoResult = await uploadLogo(logo);
        if (!logoResult.success) {
          throw new Error(logoResult.message);
        }
      }

      Swal.fire('¡Éxito!', 'Configuración actualizada correctamente', 'success');
      setSaving(false);
    } catch (error) {
      console.error('Error al guardar:', error);
      Swal.fire('Error', error.response?.data?.message || 'Error al guardar la configuración', 'error');
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Mostrar loading mientras se verifica la autenticación
  if (authLoading || loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  // Si no está autenticado o no es admin, mostrar loading (será redirigido)
  if (!isAuthenticated || user?.rol !== 'administrador') {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <nav className="navbar">
        <div className="container">
          <Link to="/dashboard" className="navbar-brand">
            {config.logo ? (
              <img 
                src={`http://localhost:5000${config.logo}`} 
                alt="Logo" 
                style={{ 
                  width: '30px', 
                  height: '30px', 
                  objectFit: 'contain',
                  marginRight: '0.5rem'
                }} 
              />
            ) : (
              <span style={{ marginRight: '0.5rem' }}>📅</span>
            )}
            {config.nombre_proyecto}
          </Link>
          <ul className="navbar-nav">
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/users">Usuarios</Link></li>
            <li><Link to="/settings">Configuración</Link></li>
            <li><Link to="/profile">Mi Perfil</Link></li>
            <li><button onClick={handleLogout} className="btn btn-secondary">Salir</button></li>
          </ul>
        </div>
      </nav>

      <main className="main-content">
        <div className="container">
          <h1 style={{ marginBottom: '2rem' }}>Configuración del Sistema</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2">
              {/* Columna 1: Información General */}
              <div className="card">
                <h2 style={{ marginBottom: '1.5rem' }}>Información General</h2>

                <div className="form-group">
                  <label>Nombre del Proyecto *</label>
                  <input
                    type="text"
                    name="nombre_proyecto"
                    className="form-control"
                    value={formData.nombre_proyecto}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea
                    name="descripcion_proyecto"
                    className="form-control"
                    value={formData.descripcion_proyecto}
                    onChange={handleInputChange}
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label>Email del Sistema</label>
                  <input
                    type="email"
                    name="email_sistema"
                    className="form-control"
                    value={formData.email_sistema}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono del Sistema</label>
                  <input
                    type="text"
                    name="telefono_sistema"
                    className="form-control"
                    value={formData.telefono_sistema}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Dirección</label>
                  <textarea
                    name="direccion_sistema"
                    className="form-control"
                    value={formData.direccion_sistema}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>
              </div>

              {/* Columna 2: Personalización Visual */}
              <div className="card">
                <h2 style={{ marginBottom: '1.5rem' }}>Personalización Visual</h2>

                {/* Logo */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Logo del Sistema
                  </label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{
                      width: '100px',
                      height: '100px',
                      border: '2px solid var(--border-color)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      backgroundColor: 'var(--light-color)'
                    }}>
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                      ) : (
                        <span style={{ fontSize: '2rem' }}>📅</span>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        onChange={handleLogoChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="logo-upload" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                        Cambiar Logo
                      </label>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-color)', marginTop: '0.5rem' }}>
                        Tamaño recomendado: 200x200px
                      </p>
                    </div>
                  </div>
                </div>

                {/* Favicon */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Favicon
                  </label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      border: '2px solid var(--border-color)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      backgroundColor: 'var(--light-color)'
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>📅</span>
                    </div>
                    <div>
                      <button 
                        className="btn btn-secondary" 
                        disabled
                        style={{ 
                          cursor: 'not-allowed', 
                          opacity: 0.6,
                          backgroundColor: '#6c757d',
                          borderColor: '#6c757d'
                        }}
                      >
                        Favicon Fijo
                      </button>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-color)', marginTop: '0.5rem' }}>
                        Favicon predeterminado del sistema
                      </p>
                    </div>
                  </div>
                </div>

                {/* Colores */}
                <div className="grid grid-cols-2">
                  <div className="form-group">
                    <label>Color Primario</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="color"
                        name="color_primario"
                        value={formData.color_primario}
                        onChange={handleInputChange}
                        style={{ width: '60px', height: '40px', border: 'none', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        name="color_primario"
                        className="form-control"
                        value={formData.color_primario}
                        onChange={handleInputChange}
                        placeholder="#667eea"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Color Secundario</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="color"
                        name="color_secundario"
                        value={formData.color_secundario}
                        onChange={handleInputChange}
                        style={{ width: '60px', height: '40px', border: 'none', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        name="color_secundario"
                        className="form-control"
                        value={formData.color_secundario}
                        onChange={handleInputChange}
                        placeholder="#764ba2"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Preview de colores */}
                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Vista Previa
                  </label>
                  <div style={{
                    padding: '1.5rem',
                    background: `linear-gradient(135deg, ${formData.color_primario} 0%, ${formData.color_secundario} 100%)`,
                    borderRadius: '10px',
                    color: 'white',
                    textAlign: 'center'
                  }}>
                    <h3 style={{ margin: 0 }}>{formData.nombre_proyecto}</h3>
                    <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                      {formData.descripcion_proyecto || 'Descripción del sistema'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={saving}
                style={{ minWidth: '200px' }}
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Settings;

