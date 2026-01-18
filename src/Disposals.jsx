import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { disposals, assets } from './api';
import { validateFile } from './utils/fileValidation';
import Pagination from './components/Pagination';

export default function Disposals() {
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
    asset_id: '', disposal_date: '', disposal_method: 'Auction',
    disposal_value: '', reason: ''
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
      const [dispRes, assetRes] = await Promise.all([
        disposals.getAll({ search: debouncedSearch, sortBy, sortOrder, page: pagination.page, limit: pagination.limit }),
        assets.getAll()
      ]);
      setList(dispRes.data.data.disposals);
      setPagination(dispRes.data.data.pagination);
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
      await disposals.create(data);
      setShowForm(false);
      setFormData({ asset_id: '', disposal_date: '', disposal_method: 'Auction', disposal_value: '', reason: '' });
      loadData();
    } catch (err) {
      alert('Failed to create disposal: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleApprove = async (id, status) => {
    try {
      await disposals.approve(id, status);
      loadData();
    } catch (err) {
      alert('Failed to approve: ' + (err.response?.data?.message || err.message));
    }
  };

  const canApprove = user?.role === 'Admin';

  return (
    <div className="page">
      <header className="page-header">
        <h1>Disposal Management</h1>
        <div>
          <button onClick={() => navigate('/dashboard')}>← Back</button>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ New Disposal</button>
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
          <div className="loading">Loading disposals...</div>
        ) : (
        <table>
          <thead>
            <tr>
              <th onClick={() => { setSortBy('disposal_id'); setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC'); }} style={{ cursor: 'pointer' }}>
                Disposal ID {sortBy === 'disposal_id' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th>Asset</th>
              <th onClick={() => { setSortBy('disposal_method'); setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC'); }} style={{ cursor: 'pointer' }}>
                Method {sortBy === 'disposal_method' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th onClick={() => { setSortBy('disposal_date'); setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC'); }} style={{ cursor: 'pointer' }}>
                Date {sortBy === 'disposal_date' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th onClick={() => { setSortBy('disposal_value'); setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC'); }} style={{ cursor: 'pointer' }}>
                Value {sortBy === 'disposal_value' && (sortOrder === 'ASC' ? '↑' : '↓')}
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
                <td>{item.disposal_id}</td>
                <td>{item.asset?.name}</td>
                <td>{item.disposal_method}</td>
                <td>{new Date(item.disposal_date).toLocaleDateString()}</td>
                <td>₹{item.disposal_value?.toLocaleString()}</td>
                <td><span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span></td>
                <td>
                  {canApprove && item.status === 'Pending' && (
                    <>
                      <button onClick={() => handleApprove(item.id, 'Approved')} className="btn-sm success">Approve</button>
                      <button onClick={() => handleApprove(item.id, 'Rejected')} className="btn-sm danger">Reject</button>
                    </>
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
            <h2>New Disposal Request</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Asset *</label>
                <select value={formData.asset_id} onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })} required>
                  <option value="">Select Asset</option>
                  {assetList.map(a => <option key={a.id} value={a.id}>{a.asset_id} - {a.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Disposal Date *</label>
                <input type="date" value={formData.disposal_date} onChange={(e) => setFormData({ ...formData, disposal_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Method *</label>
                <select value={formData.disposal_method} onChange={(e) => setFormData({ ...formData, disposal_method: e.target.value })} required>
                  <option value="Auction">Auction</option>
                  <option value="Scrap">Scrap</option>
                  <option value="Donation">Donation</option>
                  <option value="e-Waste">e-Waste</option>
                </select>
              </div>
              <div className="form-group">
                <label>Disposal Value</label>
                <input type="number" value={formData.disposal_value} onChange={(e) => setFormData({ ...formData, disposal_value: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Reason</label>
                <textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} rows="3"></textarea>
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
