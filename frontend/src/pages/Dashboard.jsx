import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';

function Dashboard() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const { config } = useConfig();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  // Si no está autenticado, mostrar loading (será redirigido)
  if (!isAuthenticated) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
            <li><Link to="/calendario">Calendario</Link></li>
            <li><Link to="/eventos">Eventos</Link></li>
            <li><Link to="/tareas">Tareas</Link></li>
            <li><Link to="/reportes">Reportes</Link></li>
            <li><button onClick={handleLogout} className="btn btn-secondary">Salir</button></li>
          </ul>
        </div>
      </nav>

      <main className="main-content">
        <div className="container">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.5rem', 
            marginBottom: '2rem',
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: 'var(--shadow)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid var(--primary-color)',
              backgroundColor: 'var(--light-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {user?.avatar ? (
                <img 
                  src={`http://localhost:5000${user.avatar}`} 
                  alt={user.nombres}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '3rem' }}>👤</span>
              )}
            </div>
            
            <div>
              <h1 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--dark-color)' }}>
                Bienvenido, {user?.nombres || 'Usuario'} {user?.apellidos || ''}
              </h1>
              <p style={{ 
                margin: '0.5rem 0 0 0', 
                fontSize: '1rem',
                color: 'var(--text-color)'
              }}>
                <span style={{ 
                  display: 'inline-block',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  backgroundColor: user?.rol === 'administrador' ? '#fecaca' : user?.rol === 'docente' ? '#bfdbfe' : '#d1fae5',
                  color: user?.rol === 'administrador' ? '#991b1b' : user?.rol === 'docente' ? '#1e40af' : '#065f46',
                  textTransform: 'capitalize'
                }}>
                  {user?.rol || 'Usuario'}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4">
            <div className="card">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
              <h3 style={{ color: 'var(--primary-color)', fontSize: '2rem' }}>0</h3>
              <p>Eventos Próximos</p>
            </div>

            <div className="card">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
              <h3 style={{ color: 'var(--success-color)', fontSize: '2rem' }}>0</h3>
              <p>Tareas Completadas</p>
            </div>

            <div className="card">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏰</div>
              <h3 style={{ color: 'var(--warning-color)', fontSize: '2rem' }}>0</h3>
              <p>Tareas Pendientes</p>
            </div>

            <div className="card">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔔</div>
              <h3 style={{ color: 'var(--info-color)', fontSize: '2rem' }}>0</h3>
              <p>Notificaciones</p>
            </div>
          </div>

          <div className="grid grid-cols-2" style={{ marginTop: '2rem' }}>
            <div className="card">
              <h2 style={{ marginBottom: '1rem' }}>Próximos Eventos</h2>
              <p style={{ color: 'var(--text-color)' }}>
                No hay eventos programados
              </p>
            </div>

            <div className="card">
              <h2 style={{ marginBottom: '1rem' }}>Tareas Recientes</h2>
              <p style={{ color: 'var(--text-color)' }}>
                No hay tareas registradas
              </p>
            </div>
          </div>

          <div className="card" style={{ marginTop: '2rem', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem' }}>🚀 Sistema en Desarrollo</h2>
            <p style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>
              El sistema está configurado y listo. Los módulos de calendario, eventos, 
              tareas y reportes serán implementados a continuación.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/calendario" className="btn btn-primary">Ver Calendario</Link>
              <Link to="/eventos" className="btn btn-secondary">Gestionar Eventos</Link>
              <Link to="/tareas" className="btn btn-secondary">Gestionar Tareas</Link>
              <Link to="/reportes" className="btn btn-secondary">Generar Reportes</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;


