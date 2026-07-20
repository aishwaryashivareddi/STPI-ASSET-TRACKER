import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, users, master } from './api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [branches, setBranches] = useState([]);
  const [regSuccess, setRegSuccess] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regData, setRegData] = useState({
    full_name: '', username: '', email: '', password: '', confirm_password: '', branch_id: '', department: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (showRegister && branches.length === 0) {
      master.getBranches().then(r => setBranches(r.data.data)).catch(() => {});
    }
  }, [showRegister]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await auth.login(email, password);
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (regData.password !== regData.confirm_password) {
      setRegError('Passwords do not match');
      return;
    }
    if (regData.password.length < 6) {
      setRegError('Password must be at least 6 characters');
      return;
    }
    setRegLoading(true);
    try {
      const { full_name, username, email, password, branch_id, department } = regData;
      await users.selfRegister({ full_name, username, email, password, branch_id, department });
      setRegSuccess('Registration submitted! Please wait for Admin approval before logging in.');
      setRegData({ full_name: '', username: '', email: '', password: '', confirm_password: '', branch_id: '', department: '' });
    } catch (err) {
      setRegError(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>STPI Asset Tracker</h1>

        {!showRegister ? (
          <>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@stpi.in" />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="admin123" />
              </div>
              {error && <div className="error">{error}</div>}
              <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
              <div style={{ marginTop: '10px', textAlign: 'center', display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" onClick={() => navigate('/forgot-password')} className="btn-link" style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}>
                  Forgot Password?
                </button>
                <button type="button" onClick={() => { setShowRegister(true); setError(''); }} className="btn-link" style={{ background: 'none', border: 'none', color: '#38a169', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}>
                  Register
                </button>
              </div>
            </form>
            <div className="demo-credentials">
              <p><strong>Demo Credentials:</strong></p>
              <p>Admin: admin@stpi.in / admin123</p>
              <p>Manager: manager.hyd@stpi.in / admin123</p>
              <p>User: user.hyd@stpi.in / admin123</p>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: '16px', marginBottom: '16px', color: '#4a5568' }}>Create Account</h2>
            {regSuccess ? (
              <div style={{ background: '#c6f6d5', color: '#22543d', padding: '16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                ✅ {regSuccess}
                <br />
                <button type="button" onClick={() => { setShowRegister(false); setRegSuccess(''); }} style={{ marginTop: '12px', background: '#38a169', color: 'white', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}>
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input value={regData.full_name} onChange={(e) => setRegData({ ...regData, full_name: e.target.value })} required placeholder="e.g. Aishwarya Reddi" />
                </div>
                <div className="form-group">
                  <label>Username *</label>
                  <input value={regData.username} onChange={(e) => setRegData({ ...regData, username: e.target.value })} required placeholder="e.g. aishwarya.r" />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={regData.email} onChange={(e) => setRegData({ ...regData, email: e.target.value })} required placeholder="your@email.com" />
                </div>
                <div className="form-group">
                  <label>Branch *</label>
                  <select value={regData.branch_id} onChange={(e) => setRegData({ ...regData, branch_id: e.target.value })} required>
                    <option value="">Select Branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input value={regData.department} onChange={(e) => setRegData({ ...regData, department: e.target.value })} placeholder="e.g. IT, Admin, Finance (optional)" />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input type="password" value={regData.password} onChange={(e) => setRegData({ ...regData, password: e.target.value })} required placeholder="Min 6 characters" />
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input type="password" value={regData.confirm_password} onChange={(e) => setRegData({ ...regData, confirm_password: e.target.value })} required placeholder="Re-enter password" />
                </div>
                {regError && <div className="error">{regError}</div>}
                <button type="submit" disabled={regLoading}>{regLoading ? 'Submitting...' : 'Submit Registration'}</button>
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <button type="button" onClick={() => { setShowRegister(false); setRegError(''); }} style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' }}>
                    ← Back to Login
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
