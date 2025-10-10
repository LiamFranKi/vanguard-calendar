import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import axios from 'axios';
import Swal from 'sweetalert2';

function Profile() {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    clave: '',
    confirmarClave: ''
  });
  const { config } = useConfig();
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    } else if (!authLoading && isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, navigate, authLoading]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/profile/me');
      const userData = response.data.user;
      setFormData({
        nombres: userData.nombres,
        apellidos: userData.apellidos,
        email: userData.email || '',
        telefono: userData.telefono || '',
        clave: '',
        confirmarClave: ''
      });
      if (userData.avatar) {
        setAvatarPreview(`http://localhost:5000${userData.avatar}`);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'El archivo es demasiado grande. Máximo 5MB'
        });
        return;
      }
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.clave && formData.clave !== formData.confirmarClave) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Las contraseñas no coinciden'
      });
      return;
    }

    try {
      const dataToSend = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        email: formData.email,
        telefono: formData.telefono
      };

      if (formData.clave) {
        dataToSend.clave = formData.clave;
      }

      await axios.put('/api/profile/update', dataToSend);

      if (avatar) {
        const formDataFile = new FormData();
        formDataFile.append('avatar', avatar);
        await axios.post('/api/profile/upload-avatar', formDataFile);
      }

      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Perfil actualizado correctamente'
      });

      setFormData({
        ...formData,
        clave: '',
        confirmarClave: ''
      });
      setAvatar(null);
      fetchProfile();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Error al actualizar el perfil'
      });
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

  // Si no está autenticado, mostrar loading (será redirigido)
  if (!isAuthenticated) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${config.color_primario || '#667eea'}CC 0%, ${config.color_secundario || '#764ba2'}CC 100%)`,
      position: 'relative'
    }}>
      {/* Navbar moderna */}
      <nav style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        padding: '1rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link to="/dashboard" style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#1f2937'
          }}>
            {config.logo ? (
              <img 
                src={`http://localhost:5000${config.logo}`} 
                alt="Logo" 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  objectFit: 'contain'
                }} 
              />
            ) : (
              <span style={{ fontSize: '2rem' }}>📅</span>
            )}
            <span>{config.nombre_proyecto}</span>
          </Link>
          
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <Link to="/dashboard" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Dashboard</Link>
            <Link to="/calendario" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Calendario</Link>
            <Link to="/eventos" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Eventos</Link>
            <Link to="/tareas" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Tareas</Link>
            {user?.rol === 'administrador' && (
              <>
                <Link to="/users" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Usuarios</Link>
                <Link to="/settings" style={{ textDecoration: 'none', color: '#6b7280', fontWeight: '500' }}>Configuración</Link>
              </>
            )}
            <Link to="/profile" style={{ textDecoration: 'none', color: '#1f2937', fontWeight: '500' }}>Mi Perfil</Link>
            
              <button 
                onClick={handleLogout} 
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#3b82f6',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
                }}
              >
                Salir
              </button>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main style={{ padding: '3rem 0' }}>
        <div className="container">
          {/* Título de página */}
          <div style={{
            marginBottom: '2rem'
          }}>
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
              👤 Mi Perfil
            </h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              {/* Card: Avatar */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '2.5rem',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                textAlign: 'center'
              }}>
                <h2 style={{ 
                  marginBottom: '2rem',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1f2937'
                }}>
                  📸 Foto de Perfil
                </h2>
                
                <div style={{
                  width: '200px',
                  height: '200px',
                  margin: '0 auto 2rem',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: `4px solid ${config.color_primario || '#667eea'}`,
                  boxShadow: `0 10px 30px ${config.color_primario || '#667eea'}40`,
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{ fontSize: '5rem' }}>👤</span>
                  )}
                </div>

                <input
                  type="file"
                  id="avatar"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <label 
                  htmlFor="avatar" 
                  style={{ 
                    display: 'inline-block',
                    padding: '0.75rem 2rem',
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
                  📷 Cambiar Foto
                </label>
                <p style={{ 
                  marginTop: '1.5rem', 
                  fontSize: '0.875rem', 
                  color: '#6b7280',
                  lineHeight: '1.6'
                }}>
                  Tamaño máximo: 5MB<br />
                  Formatos: JPG, PNG, GIF, WEBP
                </p>
              </div>

              {/* Card: Información Personal */}
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
                  📋 Información Personal
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Nombres *
                    </label>
                    <input
                      type="text"
                      name="nombres"
                      value={formData.nombres}
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
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      name="apellidos"
                      value={formData.apellidos}
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
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
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
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
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
                </div>
              </div>
            </div>

            {/* Card: Cambiar Contraseña */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '2.5rem',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              marginBottom: '2rem'
            }}>
              <h2 style={{ 
                marginBottom: '2rem',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937'
              }}>
                🔒 Cambiar Contraseña
              </h2>

              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    name="clave"
                    value={formData.clave}
                    onChange={handleInputChange}
                    placeholder="Dejar en blanco para no cambiar"
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
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    name="confirmarClave"
                    value={formData.confirmarClave}
                    onChange={handleInputChange}
                    placeholder="Confirmar nueva contraseña"
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
                style={{
                  padding: '1rem 3rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
                }}
              >
                💾 Guardar Cambios
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
        </div>
      </main>
    </div>
  );
}

export default Profile;
