import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import Navbar from '../components/Navbar';
import PushNotificationManager from '../components/PushNotificationManager';
import axios from 'axios';
import Swal from 'sweetalert2';
import { getImageUrl, getServerUrl } from '../config/constants';

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
  const { config, updateConfig, uploadLogo, fetchConfig } = useConfig();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.rol !== 'administrador')) {
      navigate('/dashboard');
    } else if (!authLoading && config) {
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
      const result = await updateConfig(formData);
      if (!result.success) {
        throw new Error(result.message);
      }

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

  if (authLoading || loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!isAuthenticated || user?.rol !== 'administrador') {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${config.color_primario || '#667eea'}CC 0%, ${config.color_secundario || '#764ba2'}CC 100%)`,
      position: 'relative'
    }}>
      {/* Navbar unificado */}
      <Navbar />

      {/* Contenido principal */}
      <main style={{ padding: '3rem 0' }}>
        <div className="container">
          {/* Título de página */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: '2.5rem', 
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              padding: '1.5rem 2rem',
              borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#1f2937',
              fontWeight: '800'
            }}>
              ⚙️ Configuración del Sistema
            </h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              {/* Card: Información General */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '2.5rem',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <h2 style={{ 
                  marginBottom: '2rem',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1f2937'
                }}>
                  📝 Información General
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Nombre del Proyecto *
                    </label>
                    <input
                      type="text"
                      name="nombre_proyecto"
                      value={formData.nombre_proyecto}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '2px solid #e5e7eb',
                        fontSize: '1rem',
                        transition: 'border-color 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = config.color_primario || '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Descripción
                    </label>
                    <textarea
                      name="descripcion_proyecto"
                      value={formData.descripcion_proyecto}
                      onChange={handleInputChange}
                      rows="4"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '2px solid #e5e7eb',
                        fontSize: '1rem',
                        transition: 'border-color 0.2s',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                      onFocus={(e) => e.target.style.borderColor = config.color_primario || '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Email del Sistema
                    </label>
                    <input
                      type="email"
                      name="email_sistema"
                      value={formData.email_sistema}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '2px solid #e5e7eb',
                        fontSize: '1rem',
                        transition: 'border-color 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = config.color_primario || '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Teléfono del Sistema
                    </label>
                    <input
                      type="text"
                      name="telefono_sistema"
                      value={formData.telefono_sistema}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '2px solid #e5e7eb',
                        fontSize: '1rem',
                        transition: 'border-color 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = config.color_primario || '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Dirección
                    </label>
                    <textarea
                      name="direccion_sistema"
                      value={formData.direccion_sistema}
                      onChange={handleInputChange}
                      rows="3"
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '2px solid #e5e7eb',
                        fontSize: '1rem',
                        transition: 'border-color 0.2s',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                      onFocus={(e) => e.target.style.borderColor = config.color_primario || '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>
                </div>
              </div>

              {/* Card: Personalización Visual */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '2.5rem',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <h2 style={{ 
                  marginBottom: '2rem',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1f2937'
                }}>
                  🎨 Personalización Visual
                </h2>

                {/* Logo */}
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '600', color: '#374151' }}>
                    Logo del Sistema
                  </label>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{
                      width: '120px',
                      height: '120px',
                      border: `3px solid ${config.color_primario || '#667eea'}`,
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      backgroundColor: '#f9fafb',
                      boxShadow: `0 4px 15px ${config.color_primario || '#667eea'}30`
                    }}>
                      {logoPreview ? (
                        <img 
                          src={logoPreview.startsWith('data:') ? logoPreview : `${getImageUrl(logoPreview)}`} 
                          alt="Logo" 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                        />
                      ) : (
                        <span style={{ fontSize: '3rem' }}>📅</span>
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
                      <label 
                        htmlFor="logo-upload" 
                        style={{ 
                          display: 'inline-block',
                          padding: '0.75rem 1.5rem',
                          background: '#3b82f6',
                          color: 'white',
                          borderRadius: '10px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                          transition: 'transform 0.2s',
                          border: 'none'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                      >
                        🖼️ Cambiar Logo
                      </label>
                      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.75rem', lineHeight: '1.5' }}>
                        Tamaño recomendado: 200x200px
                      </p>
                    </div>
                  </div>
                </div>

                {/* Favicon */}
                <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
                  <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '600', color: '#374151' }}>
                    Favicon
                  </label>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      backgroundColor: '#f9fafb'
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>📅</span>
                    </div>
                    <div>
                      <button 
                        type="button"
                        disabled
                        style={{ 
                          padding: '0.75rem 1.5rem',
                          cursor: 'not-allowed', 
                          opacity: 0.6,
                          backgroundColor: '#9ca3af',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: '600'
                        }}
                      >
                        Favicon Fijo
                      </button>
                      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.75rem' }}>
                        Favicon predeterminado del sistema
                      </p>
                    </div>
                  </div>
                </div>

                {/* Colores */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Color Primario
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="color"
                        name="color_primario"
                        value={formData.color_primario}
                        onChange={handleInputChange}
                        style={{ 
                          width: '45px', 
                          height: '45px', 
                          border: 'none', 
                          cursor: 'pointer',
                          borderRadius: '8px',
                          flexShrink: 0
                        }}
                      />
                      <input
                        type="text"
                        name="color_primario"
                        value={formData.color_primario}
                        onChange={handleInputChange}
                        placeholder="#667eea"
                        style={{
                          width: '120px',
                          padding: '0.75rem 0.75rem',
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb',
                          fontSize: '0.9rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Color Secundario
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="color"
                        name="color_secundario"
                        value={formData.color_secundario}
                        onChange={handleInputChange}
                        style={{ 
                          width: '45px', 
                          height: '45px', 
                          border: 'none', 
                          cursor: 'pointer',
                          borderRadius: '8px',
                          flexShrink: 0
                        }}
                      />
                      <input
                        type="text"
                        name="color_secundario"
                        value={formData.color_secundario}
                        onChange={handleInputChange}
                        placeholder="#764ba2"
                        style={{
                          width: '120px',
                          padding: '0.75rem 0.75rem',
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb',
                          fontSize: '0.9rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Vista Previa */}
                <div>
                  <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '600', color: '#374151' }}>
                    Vista Previa
                  </label>
                  <div style={{
                    padding: '2.5rem',
                    background: `linear-gradient(135deg, ${formData.color_primario} 0%, ${formData.color_secundario} 100%)`,
                    borderRadius: '16px',
                    color: 'white',
                    textAlign: 'center',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
                  }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '1.75rem',
                      fontWeight: '800',
                      letterSpacing: '-0.02em'
                    }}>
                      {formData.nombre_proyecto || 'Nombre del Proyecto'}
                    </h3>
                    <p style={{ margin: '1rem 0 0 0', opacity: 0.95, fontSize: '1.05rem' }}>
                      {formData.descripcion_proyecto || 'Descripción del sistema de gestión'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '1rem 3rem',
                  background: saving ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: saving ? '0 4px 15px rgba(156, 163, 175, 0.4)' : '0 4px 15px rgba(59, 130, 246, 0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  opacity: saving ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = saving ? '0 4px 15px rgba(156, 163, 175, 0.4)' : '0 4px 15px rgba(59, 130, 246, 0.4)';
                }}
              >
                {saving ? '⏳ Guardando...' : '💾 Guardar Cambios'}
              </button>

              <Link
                to="/dashboard"
                style={{
                  padding: '1rem 3rem',
                  background: 'white',
                  color: '#6b7280',
                  border: '2px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = config.color_primario || '#667eea';
                  e.target.style.color = config.color_primario || '#667eea';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.color = '#6b7280';
                }}
              >
                ← Volver
              </Link>
            </div>
          </form>

          {/* Sección de Push Notifications */}
          <div style={{ marginTop: '2rem' }}>
            <PushNotificationManager />
          </div>
        </div>
      </main>
    </div>
  );
}

export default Settings;
