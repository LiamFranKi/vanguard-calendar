import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import axios from 'axios';
import Swal from 'sweetalert2';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const { config } = useConfig();
  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    clave: '',
    rol: 'estudiante'
  });
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.rol !== 'administrador')) {
      navigate('/dashboard');
    } else if (!authLoading && isAuthenticated && user?.rol === 'administrador') {
      fetchUsers();
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data.users);
      setLoading(false);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
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
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('dni', formData.dni);
      formDataToSend.append('nombres', formData.nombres);
      formDataToSend.append('apellidos', formData.apellidos);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('telefono', formData.telefono);
      formDataToSend.append('rol', formData.rol);
      if (formData.clave) {
        formDataToSend.append('clave', formData.clave);
      }
      if (avatar) {
        formDataToSend.append('avatar', avatar);
      }
      
      if (editingUser) {
        // Actualizar usuario
        await axios.put(`/api/users/${editingUser.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire('¡Éxito!', 'Usuario actualizado correctamente', 'success');
      } else {
        // Crear usuario
        await axios.post('/api/users', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire('¡Éxito!', 'Usuario creado correctamente', 'success');
      }
      
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Error al guardar usuario', 'error');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      dni: user.dni,
      nombres: user.nombres,
      apellidos: user.apellidos,
      email: user.email || '',
      telefono: user.telefono || '',
      clave: '',
      rol: user.rol
    });
    if (user.avatar) {
      setAvatarPreview(`http://localhost:5000${user.avatar}`);
    } else {
      setAvatarPreview(null);
    }
    setAvatar(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/users/${id}`);
        Swal.fire('¡Eliminado!', 'El usuario ha sido eliminado', 'success');
        fetchUsers();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Error al eliminar usuario', 'error');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await axios.patch(`/api/users/${id}/toggle-status`);
      Swal.fire('¡Actualizado!', 'Estado del usuario actualizado', 'success');
      fetchUsers();
    } catch (error) {
      Swal.fire('Error', 'Error al actualizar estado', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      dni: '',
      nombres: '',
      apellidos: '',
      email: '',
      telefono: '',
      clave: '',
      rol: 'estudiante'
    });
    setAvatar(null);
    setAvatarPreview(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Mostrar loading mientras se verifica la autenticación o se cargan los datos
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>Gestión de Usuarios</h1>
            <button 
              className="btn btn-primary" 
              onClick={() => { resetForm(); setEditingUser(null); setShowModal(true); }}
            >
              + Nuevo Usuario
            </button>
          </div>

          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>DNI</th>
                  <th>Nombres</th>
                  <th>Apellidos</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        margin: '0 auto',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        backgroundColor: 'var(--light-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {user.avatar ? (
                          <img 
                            src={`http://localhost:5000${user.avatar}`} 
                            alt={user.nombres}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span>👤</span>
                        )}
                      </div>
                    </td>
                    <td>{user.dni}</td>
                    <td>{user.nombres}</td>
                    <td>{user.apellidos}</td>
                    <td>{user.email || '-'}</td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '0.25rem', 
                        fontSize: '0.875rem',
                        backgroundColor: user.rol === 'administrador' ? '#fecaca' : user.rol === 'docente' ? '#bfdbfe' : '#d1fae5',
                        color: user.rol === 'administrador' ? '#991b1b' : user.rol === 'docente' ? '#1e40af' : '#065f46'
                      }}>
                        {user.rol}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '0.25rem', 
                        fontSize: '0.875rem',
                        backgroundColor: user.activo ? '#d1fae5' : '#fee2e2',
                        color: user.activo ? '#065f46' : '#991b1b'
                      }}>
                        {user.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleEdit(user)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleToggleStatus(user.id)}
                          title={user.activo ? 'Desactivar' : 'Activar'}
                        >
                          {user.activo ? '🔒' : '🔓'}
                        </button>
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleDelete(user.id)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', margin: '1rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              {/* Avatar */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  margin: '0 auto 1rem',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid var(--border-color)',
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
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="avatar-upload" className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
                  Cambiar Foto
                </label>
              </div>

              <div className="form-group">
                <label>DNI *</label>
                <input
                  type="text"
                  name="dni"
                  className="form-control"
                  value={formData.dni}
                  onChange={handleInputChange}
                  required
                  maxLength="8"
                  disabled={editingUser}
                />
              </div>

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

              <div className="form-group">
                <label>Clave {editingUser && '(dejar en blanco para no cambiar)'}</label>
                <input
                  type="password"
                  name="clave"
                  className="form-control"
                  value={formData.clave}
                  onChange={handleInputChange}
                  required={!editingUser}
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label>Rol *</label>
                <select
                  name="rol"
                  className="form-control"
                  value={formData.rol}
                  onChange={handleInputChange}
                  required
                >
                  <option value="estudiante">Estudiante</option>
                  <option value="docente">Docente</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => { setShowModal(false); setEditingUser(null); resetForm(); }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;

