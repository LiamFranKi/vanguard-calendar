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
      Swal.fire('Error', 'Las claves no coinciden', 'error');
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

      await axios.put('/api/profile/me', dataToSend);
      
      // Si hay avatar, subirlo
      if (avatar) {
        const formData = new FormData();
        formData.append('avatar', avatar);
        await axios.post('/api/profile/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      Swal.fire('¡Éxito!', 'Perfil actualizado correctamente', 'success');
      fetchProfile();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Error al actualizar perfil', 'error');
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
            {user?.rol === 'administrador' && (
              <>
                <li><Link to="/users">Usuarios</Link></li>
                <li><Link to="/settings">Configuración</Link></li>
              </>
            )}
            <li><Link to="/profile">Mi Perfil</Link></li>
            <li><button onClick={handleLogout} className="btn btn-secondary">Salir</button></li>
          </ul>
        </div>
      </nav>

      <main className="main-content">
        <div className="container">
          <h1 style={{ marginBottom: '2rem' }}>Mi Perfil</h1>

          <div className="grid grid-cols-2">
            {/* Columna 1: Avatar */}
            <div className="card">
              <h2 style={{ marginBottom: '1.5rem' }}>Foto de Perfil</h2>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '200px',
                  height: '200px',
                  margin: '0 auto 1.5rem',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '4px solid var(--border-color)',
                  backgroundColor: 'var(--light-color)',
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
                    <span style={{ fontSize: '4rem' }}>👤</span>
                  )}
                </div>

                <input
                  type="file"
                  id="avatar"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="avatar" className="btn btn-primary" style={{ cursor: 'pointer' }}>
                  Cambiar Foto
                </label>
                <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-color)' }}>
                  Tamaño máximo: 5MB<br />
                  Formatos: JPG, PNG, GIF, WEBP
                </p>
              </div>

              <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--light-color)', borderRadius: '0.5rem' }}>
                <p><strong>DNI:</strong> {user?.dni}</p>
                <p><strong>Rol:</strong> <span style={{ 
                  textTransform: 'capitalize',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  backgroundColor: user?.rol === 'administrador' ? '#fecaca' : user?.rol === 'docente' ? '#bfdbfe' : '#d1fae5',
                  color: user?.rol === 'administrador' ? '#991b1b' : user?.rol === 'docente' ? '#1e40af' : '#065f46'
                }}>{user?.rol}</span></p>
              </div>
            </div>

            {/* Columna 2: Formulario */}
            <div className="card">
              <h2 style={{ marginBottom: '1.5rem' }}>Información Personal</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nombres *</label>
                  <input
                    type="text"
                    name="nombres"
                    className="form-control"
                    value={formData.nombres}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Apellidos *</label>
                  <input
                    type="text"
                    name="apellidos"
                    className="form-control"
                    value={formData.apellidos}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    name="telefono"
                    className="form-control"
                    value={formData.telefono}
                    onChange={handleInputChange}
                  />
                </div>

                <hr style={{ margin: '2rem 0', border: '1px solid var(--border-color)' }} />

                <h3 style={{ marginBottom: '1rem' }}>Cambiar Clave</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-color)', marginBottom: '1rem' }}>
                  Deja en blanco si no deseas cambiar tu clave
                </p>

                <div className="form-group">
                  <label>Nueva Clave</label>
                  <input
                    type="password"
                    name="clave"
                    className="form-control"
                    value={formData.clave}
                    onChange={handleInputChange}
                    minLength="6"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div className="form-group">
                  <label>Confirmar Nueva Clave</label>
                  <input
                    type="password"
                    name="confirmarClave"
                    className="form-control"
                    value={formData.confirmarClave}
                    onChange={handleInputChange}
                    minLength="6"
                    placeholder="Confirma tu nueva clave"
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                  Guardar Cambios
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;

