import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { maintenances, assets } from './api';
import { validateFile } from './utils/fileValidation';
import Pagination from './components/Pagination';

export default function Maintenances() {
  const [list, setList] = useState([]);
  const [assetList, setAssetList] = useState([]);
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
    asset_id: '', maintenance_type: 'Preventive', issue_description: '',
    scheduled_date: '', cost: '', vendor_name: ''
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
      const [mainRes, assetRes] = await Promise.all([
        maintenances.getAll({ search: debouncedSearch, sortBy, sortOrder, page: pagination.page, limit: pagination.limit }),
        assets.getAll()
      ]);
      setList(mainRes.data.data.maintenances);
      setPagination(mainRes.data.data.pagination);
      setAssetList(assetRes.data.data.assets);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));

    try {
      await maintenances.create(data);
      setShowForm(false);
      setFormData({ asset_id: '', maintenance_type: 'Preventive', issue_description: '', scheduled_date: '', cost: '', vendor_name: '' });
      loadData();
    } catch (err) {
      alert('Failed to create maintenance: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleComplete = async (id) => {
    const data = new FormData();
    try {
      await maintenances.complete(id, data);
      loadData();
    } catch (err) {
      alert('Failed to complete: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete maintenance "${item.maintenance_id}"?`)) {
      return;
    }

    try {
      await maintenances.delete(item.id);
      loadData();
    } catch (err) {
      alert('Failed to delete maintenance: ' + (err.response?.data?.message || err.message));
    }
  };

  const canDelete = user?.role === 'Admin';

  return (
    <div className="page">
      <header className="page-header">
        <h1>Maintenance Management</h1>
        <div>
          <button onClick={() => navigate('/dashboard')}>← Back</button>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ New Maintenance</button>
        </div>
      </header>

      <div className="filters">
        <div className="search-wrapper">
          <span className="search-icon"></span>
          <input 
            type="text" 
            placeholder="Search by ID, asset..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPagination({ ...pagination, page: 1 }); }}
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading">Loading maintenances...</div>
        ) : (
        <table>
          <thead>
            <tr>
              <th onClick={() => { setSortBy('maintenance_id'); setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC'); }} style={{ cursor: 'pointer' }}>
                Maintenance ID {sortBy === 'maintenance_id' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th>Asset</th>
              <th onClick={() => { setSortBy('maintenance_type'); setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC'); }} style={{ cursor: 'pointer' }}>
                Type {sortBy === 'maintenance_type' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th onClick={() => { setSortBy('scheduled_date'); setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC'); }} style={{ cursor: 'pointer' }}>
                Scheduled Date {sortBy === 'scheduled_date' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th onClick={() => { setSortBy('cost'); setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC'); }} style={{ cursor: 'pointer' }}>
                Cost {sortBy === 'cost' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th onClick={() => { setSortBy('status'); setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC'); }} style={{ cursor: 'pointer' }}>
                Status {sortBy === 'status' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr key={item.id}>
                <td>{item.maintenance_id}</td>
                <td>{item.asset?.name}</td>
                <td>{item.maintenance_type}</td>
                <td>{new Date(item.scheduled_date).toLocaleDateString()}</td>
                <td>₹{item.cost?.toLocaleString()}</td>
                <td><span className={`badge ${item.status.toLowerCase().replace(' ', '-')}`}>{item.status}</span></td>
                <td>
                  {item.status !== 'Completed' && (
                    <button onClick={() => handleComplete(item.id)} className="btn-sm" style={{ marginRight: '8px' }}>Complete</button>
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
            <h2>New Maintenance Record</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Asset *</label>
                <select value={formData.asset_id} onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })} required>
                  <option value="">Select Asset</option>
                  {assetList.map(a => <option key={a.id} value={a.id}>{a.asset_id} - {a.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select value={formData.maintenance_type} onChange={(e) => setFormData({ ...formData, maintenance_type: e.target.value })} required>
                  <option value="Preventive">Preventive</option>
                  <option value="Corrective">Corrective</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
              <div className="form-group">
                <label>Issue Description</label>
                <textarea value={formData.issue_description} onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })} rows="3"></textarea>
              </div>
              <div className="form-group">
                <label>Scheduled Date *</label>
                <input type="date" value={formData.scheduled_date} onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Cost</label>
                <input type="number" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Vendor Name</label>
                <input value={formData.vendor_name} onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })} />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
