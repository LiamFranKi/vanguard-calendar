import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Tasks from './pages/Tasks';
import Notifications from './pages/Notifications';
import Calendar from './pages/Calendar';
import Events from './pages/Events';
import Reports from './pages/Reports';
import './App.css';

function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <Router future={{ 
          v7_startTransition: true,
          v7_relativeSplatPath: true 
        }}>
          <div className="App">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/tareas" element={<Tasks />} />
              <Route path="/notificaciones" element={<Notifications />} />
              <Route path="/calendario" element={<Calendar />} />
              <Route path="/eventos" element={<Events />} />
              <Route path="/reportes" element={<Reports />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;


