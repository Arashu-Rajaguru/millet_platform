import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sprout, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <Sprout size={28} color="var(--primary-color)" />
        MilletChain
      </Link>
      <div className="navbar-links">
        {user ? (
          <div className="navbar-user">
            <span>Welcome, {user.name} ({user.role})</span>
            <span className="badge badge-warning">Trust Score: {user.trust_score.toFixed(1)}</span>
            <Link to="/profile" className="btn btn-outline" style={{ padding: '8px 16px' }}>Profile</Link>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline">Login</Link>
            <Link to="/register" className="btn">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
