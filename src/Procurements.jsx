import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { procurements, master } from './api';
import Pagination from './components/Pagination';

export default function Procurements() {
  const [list, setList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    branch_id: '', requisition_date: '', budget_allocated: ''
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      navigate('/');
      return;
    }
    setUser(userData);
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadData();
  }, [debouncedSearch, sortBy, sortOrder, pagination.page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [procRes, branchRes] = await Promise.all([
        procurements.getAll({ search: debouncedSearch, sortBy, sortOrder, page: pagination.page, limit: pagination.limit }),
        master.getBranches()
      ]);
      setList(procRes.data.data.procurements);
      setPagination(procRes.data.data.pagination);
      setBranches(branchRes.data.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await procurements.create(formData);
      setShowForm(false);
      setFormData({ branch_id: '', requisition_date: '', budget_allocated: '' });
      loadData();
    } catch (err) {
      alert('Failed to create procurement: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleApprove = async (id, status) => {
    try {
      await procurements.approve(id, status);
      loadData();
    } catch (err) {
      alert('Failed to approve: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete procurement "${item.procurement_id}"?`)) {
      return;
    }

    try {
      await procurements.delete(item.id);
      loadData();
    } catch (err) {
      alert('Failed to delete procurement: ' + (err.response?.data?.message || err.message));
    }
  };

  const canApprove = user?.role === 'Admin' || user?.role === 'Manager';
  const canDelete = user?.role === 'Admin';

  return (
    <div className="page">
      <header className="page-header">
        <h1>Procurement Management</h1>
        <div>
          <button onClick={() => navigate('/dashboard')}>← Back</button>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ New Request</button>
        </div>
      </header>

      <div className="filters">
        <div className="search-wrapper">
          <span className="search-icon"></span>
          <input 
            type="text" 
            placeholder="Search by ID, branch..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPagination({ ...pagination, page: 1 }); }}
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading">Loading procurements...</div>
        ) : (
        <table>
          <thead>
            <tr>
              <th onClick={() => { setSortBy('procurement_id'); setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC'); }} style={{ cursor: 'pointer' }}>
                Procurement ID {sortBy === 'procurement_id' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th>Branch</th>
              <th onClick={() => { setSortBy('requisition_date'); setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC'); }} style={{ cursor: 'pointer' }}>
                Requisition Date {sortBy === 'requisition_date' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th onClick={() => { setSortBy('budget_allocated'); setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC'); }} style={{ cursor: 'pointer' }}>
                Budget {sortBy === 'budget_allocated' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th onClick={() => { setSortBy('approval_status'); setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC'); }} style={{ cursor: 'pointer' }}>
                Status {sortBy === 'approval_status' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr key={item.id}>
                <td>{item.procurement_id}</td>
                <td>{item.branch?.name}</td>
                <td>{new Date(item.requisition_date).toLocaleDateString()}</td>
                <td>₹{item.budget_allocated?.toLocaleString()}</td>
                <td><span className={`badge ${item.approval_status.toLowerCase()}`}>{item.approval_status}</span></td>
                <td>
                  {canApprove && item.approval_status === 'Pending' && (
                    <>
                      <button onClick={() => handleApprove(item.id, 'Approved')} className="btn-sm success" style={{ marginRight: '8px' }}>Approve</button>
                      <button onClick={() => handleApprove(item.id, 'Rejected')} className="btn-sm danger" style={{ marginRight: '8px' }}>Reject</button>
                    </>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDelete(item)} className="btn-sm btn-danger">Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
        <Pagination 
          currentPage={pagination.page} 
          totalPages={pagination.totalPages} 
          onPageChange={(page) => setPagination({ ...pagination, page })} 
        />
      </div>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>New Procurement Request</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Branch *</label>
                <select value={formData.branch_id} onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })} required>
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Requisition Date *</label>
                <input type="date" value={formData.requisition_date} onChange={(e) => setFormData({ ...formData, requisition_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Budget Allocated</label>
                <input type="number" value={formData.budget_allocated} onChange={(e) => setFormData({ ...formData, budget_allocated: e.target.value })} />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
