import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      const { access_token } = await api.login(formData);
      
      // We need to fetch user data immediately to route correctly
      localStorage.setItem("token", access_token);
      const user = await api.getMe();
      login(access_token, user);
      
      navigate(user.role === 'farmer' ? '/farmer' : '/buyer');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="glass-card auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        {error && <div className="badge badge-danger" style={{marginBottom: '1rem', display: 'block'}}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input 
              type="email" 
              className="input-field" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn" style={{width: '100%'}}>Log In</button>
        </form>
        <p style={{marginTop: '20px', textAlign: 'center', color: 'var(--text-secondary)'}}>
          Don't have an account? <Link to="/register" style={{color: 'var(--primary-color)'}}>Register</Link>
        </p>
      </div>
    </div>
  );
}
