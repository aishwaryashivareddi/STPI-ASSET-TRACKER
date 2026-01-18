import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assets, master } from './api';
import { validateFile } from './utils/fileValidation';
import Pagination from './components/Pagination';

export default function Assets() {
  const [assetList, setAssetList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showTestingForm, setShowTestingForm] = useState(null);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ asset_type: '', current_status: '' });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '', asset_type: 'COMPUTER', branch_id: '', quantity: 1,
    location: '', purchase_value: '', po_number: '', supplier_id: ''
  });

  const [files, setFiles] = useState({});

  const [newBranch, setNewBranch] = useState({ name: '', code: '', address: '' });

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
  }, [filters, debouncedSearch, sortBy, sortOrder, pagination.page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assetRes, branchRes, supplierRes] = await Promise.all([
        assets.getAll({ ...filters, search: debouncedSearch, sortBy, sortOrder, page: pagination.page, limit: pagination.limit }),
        master.getBranches(),
        master.getSuppliers()
      ]);
      setAssetList(assetRes.data.data.assets);
      setPagination(assetRes.data.data.pagination);
      setBranches(branchRes.data.data);
      setSuppliers(supplierRes.data.data);
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
    Object.keys(files).forEach(key => {
      if (files[key]) data.append(key, files[key]);
    });

    try {
      if (editingAsset) {
        await assets.update(editingAsset.id, data);
      } else {
        await assets.create(data);
      }
      setShowForm(false);
      setEditingAsset(null);
      setFormData({ name: '', asset_type: 'COMPUTER', branch_id: '', quantity: 1, location: '', purchase_value: '', po_number: '', supplier_id: '' });
      setFiles({});
      loadData();
    } catch (err) {
      alert('Failed to save asset: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      asset_type: asset.asset_type,
      branch_id: asset.branch_id,
      quantity: asset.quantity,
      location: asset.location || '',
      purchase_value: asset.purchase_value || '',
      po_number: asset.po_number || '',
      supplier_id: asset.supplier_id || ''
    });
    setShowForm(true);
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    try {
      const res = await master.createBranch(newBranch);
      const branchRes = await master.getBranches();
      setBranches(branchRes.data.data);
      setFormData({ ...formData, branch_id: res.data.data.id });
      setShowBranchForm(false);
      setNewBranch({ name: '', code: '', address: '' });
    } catch (err) {
      alert('Failed to create branch: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleTestingSubmit = async (e, assetId) => {
    e.preventDefault();
    const data = new FormData();
    data.append('testing_status', e.target.testing_status.value);
    data.append('remarks', e.target.remarks.value);
    if (e.target.testing_report_file.files[0]) {
      data.append('testing_report_file', e.target.testing_report_file.files[0]);
    }

    try {
      await assets.confirmTesting(assetId, data);
      setShowTestingForm(null);
      loadData();
    } catch (err) {
      alert('Failed to confirm testing: ' + (err.response?.data?.message || err.message));
    }
  };

  const canConfirmTesting = user?.role === 'Admin' || user?.role === 'Manager';

  return (
    <div className="page">
      <header className="page-header">
        <h1>Assets Management</h1>
        <div>
          <button onClick={() => navigate('/dashboard')}>← Back</button>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ Add Asset</button>
        </div>
      </header>

      <div className="filters">
        <div className="search-wrapper">
          <span className="search-icon"></span>
          <input 
            type="text" 
            placeholder="Search by ID, name, location..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPagination({ ...pagination, page: 1 }); }}
          />
        </div>
        <select value={filters.asset_type} onChange={(e) => { setFilters({ ...filters, asset_type: e.target.value }); setPagination({ ...pagination, page: 1 }); }}>
          <option value="">All Types</option>
          <option value="HSDC">HSDC</option>
          <option value="COMPUTER">Computer</option>
          <option value="ELECTRICAL">Electrical</option>
          <option value="OFFICE">Office</option>
          <option value="FURNITURE">Furniture</option>
          <option value="FIREFIGHTING">Fire-Fighting</option>
        </select>
        <select value={filters.current_status} onChange={(e) => { setFilters({ ...filters, current_status: e.target.value }); setPagination({ ...pagination, page: 1 }); }}>
          <option value="">All Status</option>
          <option value="Working">Working</option>
          <option value="Not Working">Not Working</option>
          <option value="Obsolete">Obsolete</option>
        </select>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading">Loading assets...</div>
        ) : (
        <table>
          <thead>
            <tr>
              <th onClick={() => { setSortBy('asset_id'); setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC'); }} style={{ cursor: 'pointer' }}>
                Asset ID {sortBy === 'asset_id' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th onClick={() => { setSortBy('name'); setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC'); }} style={{ cursor: 'pointer' }}>
                Name {sortBy === 'name' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th onClick={() => { setSortBy('asset_type'); setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC'); }} style={{ cursor: 'pointer' }}>
                Type {sortBy === 'asset_type' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th>Branch</th>
              <th>Supplier</th>
              <th onClick={() => { setSortBy('current_status'); setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC'); }} style={{ cursor: 'pointer' }}>
                Status {sortBy === 'current_status' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th>Testing</th>
              <th onClick={() => { setSortBy('purchase_value'); setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC'); }} style={{ cursor: 'pointer' }}>
                Value {sortBy === 'purchase_value' && (sortOrder === 'ASC' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assetList.map((asset) => (
              <tr key={asset.id}>
                <td>{asset.asset_id}</td>
                <td>{asset.name}</td>
                <td>{asset.asset_type}</td>
                <td>{asset.branch?.name}</td>
                <td>{asset.supplier?.name || '-'}</td>
                <td><span className={`badge ${asset.current_status.toLowerCase().replace(' ', '-')}`}>{asset.current_status}</span></td>
                <td><span className={`badge ${asset.testing_status.toLowerCase()}`}>{asset.testing_status}</span></td>
                <td>₹{asset.purchase_value?.toLocaleString()}</td>
                <td>
                  <button onClick={() => handleEdit(asset)} className="btn-sm" style={{ marginRight: '8px' }}>Edit</button>
                  {canConfirmTesting && asset.testing_status === 'Pending' && (
                    <button onClick={() => setShowTestingForm(asset.id)} className="btn-sm">Test</button>
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
            <h2>{editingAsset ? 'Edit Asset' : 'Add New Asset'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select value={formData.asset_type} onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })} required>
                    <option value="HSDC">HSDC</option>
                    <option value="COMPUTER">Computer</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="OFFICE">Office</option>
                    <option value="FURNITURE">Furniture</option>
                    <option value="FIREFIGHTING">Fire-Fighting</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Branch *</label>
                  <select 
                    value={formData.branch_id} 
                    onChange={(e) => {
                      if (e.target.value === 'ADD_NEW') {
                        setShowBranchForm(true);
                      } else {
                        setFormData({ ...formData, branch_id: e.target.value });
                      }
                    }} 
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#38a169' }}>+ Add New Branch</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Purchase Value</label>
                  <input type="number" value={formData.purchase_value} onChange={(e) => setFormData({ ...formData, purchase_value: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>PO Number</label>
                  <input value={formData.po_number} onChange={(e) => setFormData({ ...formData, po_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Supplier</label>
                  <select value={formData.supplier_id} onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}>
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Invoice File</label>
                <input type="file" onChange={(e) => {
                  const file = e.target.files[0];
                  if (validateFile(file)) setFiles({ ...files, invoice_file: file });
                  else e.target.value = '';
                }} />
              </div>
              <div className="form-group">
                <label>PO File</label>
                <input type="file" onChange={(e) => {
                  const file = e.target.files[0];
                  if (validateFile(file)) setFiles({ ...files, po_file: file });
                  else e.target.value = '';
                }} />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => { setShowForm(false); setEditingAsset(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">{editingAsset ? 'Update Asset' : 'Create Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTestingForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>Confirm Testing</h2>
            <form onSubmit={(e) => handleTestingSubmit(e, showTestingForm)}>
              <div className="form-group">
                <label>Testing Status *</label>
                <select name="testing_status" required>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
              <div className="form-group">
                <label>Remarks</label>
                <textarea name="remarks" rows="3"></textarea>
              </div>
              <div className="form-group">
                <label>Testing Report</label>
                <input type="file" name="testing_report_file" />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowTestingForm(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBranchForm && (
        <div className="modal">
          <div className="modal-content small">
            <h2>Add New Branch</h2>
            <form onSubmit={handleAddBranch}>
              <div className="form-group">
                <label>Branch Name *</label>
                <input value={newBranch.name} onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })} placeholder="e.g., Hyderabad" required />
              </div>
              <div className="form-group">
                <label>Branch Code *</label>
                <input value={newBranch.code} onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value.toUpperCase() })} placeholder="e.g., HYD" maxLength="3" required />
                <div className="form-hint">3-character code for asset ID generation</div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea value={newBranch.address} onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })} rows="3" placeholder="Enter branch address"></textarea>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowBranchForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
