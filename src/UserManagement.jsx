import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { users, master } from './api';
import { useToast } from './components/Toast';

export default function UserManagement() {
  const [list, setList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showResetModal, setShowResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'User', branch_id: '', is_active: true });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'Admin') { navigate('/dashboard'); return; }
    setUser(userData);
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userRes, branchRes] = await Promise.all([users.getAll(), master.getBranches()]);
      setList(userRes.data.data);
      setBranches(branchRes.data.data);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const { password, ...updateData } = formData;
        await users.update(editingUser.id, updateData);
        toast('User updated successfully');
      } else {
        await users.create(formData);
        toast('User created successfully');
      }
      setShowForm(false);
      setEditingUser(null);
      setFormData({ username: '', email: '', password: '', role: 'User', branch_id: '', is_active: true });
      loadData();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to save user', 'error');
    }
  };

  const handleEdit = (u) => {
    setEditingUser(u);
    setFormData({ username: u.username, email: u.email, password: '', role: u.role, branch_id: u.branch_id || '', is_active: u.is_active });
    setShowForm(true);
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
    try {
      await users.resetPassword(showResetModal, newPassword);
      toast('Password reset successfully');
      setShowResetModal(null);
      setNewPassword('');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to reset password', 'error');
    }
  };

  const handleToggleActive = async (u) => {
    try {
      await users.update(u.id, { ...u, is_active: !u.is_active });
      toast(`User ${!u.is_active ? 'activated' : 'deactivated'}`);
      loadData();
    } catch (err) {
      toast('Failed to update user', 'error');
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    try {
      await users.delete(u.id);
      toast('User deleted');
      loadData();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>User Management</h1>
        <div>
          <button onClick={() => navigate('/dashboard')}>← Back</button>
          <button onClick={() => { setEditingUser(null); setFormData({ username: '', email: '', password: '', role: 'User', branch_id: '', is_active: true }); setShowForm(true); }} className="btn-primary">+ Add User</button>
        </div>
      </header>

      <div className="table-container">
        {loading ? <div className="loading">Loading users...</div> : (
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>No users found</td></tr>
            ) : list.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td><span className={`badge ${u.role.toLowerCase()}`}>{u.role}</span></td>
                <td>{u.branch?.name || '-'}</td>
                <td>
                  <span className={`badge ${u.is_active ? 'passed' : 'failed'}`} onClick={() => handleToggleActive(u)} style={{ cursor: 'pointer' }}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleEdit(u)} className="btn-sm" style={{ marginRight: '8px' }}>Edit</button>
                  <button onClick={() => setShowResetModal(u.id)} className="btn-sm" style={{ marginRight: '8px' }}>Reset Pwd</button>
                  {u.id !== user?.id && (
                    <button onClick={() => handleDelete(u)} className="btn-sm btn-danger">Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Username *</label>
                  <input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
              </div>
              {!editingUser && (
                <div className="form-group">
                  <label>Password *</label>
                  <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} />
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label>Role *</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} required>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="User">User</option>
                    <option value="Auditor">Auditor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Branch *</label>
                  <select value={formData.branch_id} onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })} required>
                    <option value="">Select Branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => { setShowForm(false); setEditingUser(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">{editingUser ? 'Update User' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="modal">
          <div className="modal-content small">
            <h2>Reset Password</h2>
            <div className="form-group">
              <label>New Password *</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" minLength={6} />
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => { setShowResetModal(null); setNewPassword(''); }}>Cancel</button>
              <button onClick={handleResetPassword} className="btn-primary">Reset Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
