import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { assets, master } from './api';
import { validateFile } from './utils/fileValidation';
import Pagination from './components/Pagination';
import { useToast } from './components/Toast';
import SearchableSelect from './components/SearchableSelect';
import { AssetQRModal, BulkQRPrint } from './components/AssetQR';

export default function Assets() {
  const [assetList, setAssetList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showTestingForm, setShowTestingForm] = useState(null);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showFilesModal, setShowFilesModal] = useState(null);
  const [showQRModal, setShowQRModal] = useState(null);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [showBulkQR, setShowBulkQR] = useState(false);
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
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '', asset_type: 'COMPUTER', branch_id: '',
    location: '', purchase_value: '', po_number: '', supplier_id: '', serial_number: ''
  });

  const [files, setFiles] = useState({});

  const [newBranch, setNewBranch] = useState({ name: '', code: '', address: '' });
  const [newSupplier, setNewSupplier] = useState({ name: '', contact_person: '', email: '', phone: '', address: '' });

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
      const statusParam = searchParams.get('status');
      const typeParam = searchParams.get('type');
      const testingParam = searchParams.get('testing');

      const params = { search: debouncedSearch, sortBy, sortOrder, page: pagination.page, limit: pagination.limit };
      if (statusParam) params.current_status = statusParam;
      else if (filters.current_status) params.current_status = filters.current_status;
      if (typeParam) params.asset_type = typeParam;
      else if (filters.asset_type) params.asset_type = filters.asset_type;
      if (testingParam) params.testing_status = testingParam;

      const [assetRes, branchRes, supplierRes] = await Promise.all([
        assets.getAll(params),
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

    // Single create or edit
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    Object.keys(files).forEach(key => {
      if (files[key]) data.append(key, files[key]);
    });

    try {
      if (editingAsset) {
        await assets.update(editingAsset.id, data);
        toast('Asset updated successfully');
      } else {
        await assets.create(data);
        toast('Asset created successfully');
      }
      setShowForm(false);
      setEditingAsset(null);
      setFormData({ name: '', asset_type: 'COMPUTER', branch_id: '', location: '', purchase_value: '', po_number: '', supplier_id: '', serial_number: '' });
      setFiles({});
      loadData();
    } catch (err) {
      toast('Failed to save asset: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      asset_type: asset.asset_type,
      branch_id: asset.branch_id,
      location: asset.location || '',
      purchase_value: asset.purchase_value || '',
      po_number: asset.po_number || '',
      supplier_id: asset.supplier_id || '',
      serial_number: asset.serial_number || ''
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
      toast('Branch created successfully');
    } catch (err) {
      alert('Failed to create branch: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      const res = await master.createSupplier(newSupplier);
      const supplierRes = await master.getSuppliers();
      setSuppliers(supplierRes.data.data);
      setFormData({ ...formData, supplier_id: res.data.data.id });
      setShowSupplierForm(false);
      setNewSupplier({ name: '', contact_person: '', email: '', phone: '', address: '' });
      toast('Supplier created successfully');
    } catch (err) {
      alert('Failed to create supplier: ' + (err.response?.data?.message || err.message));
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
      toast('Testing confirmed successfully');
      loadData();
    } catch (err) {
      alert('Failed to confirm testing: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (asset) => {
    if (!window.confirm(`Are you sure you want to delete asset "${asset.name}" (${asset.asset_id})?`)) {
      return;
    }

    try {
      await assets.delete(asset.id);
      toast('Asset deleted successfully');
      loadData();
    } catch (err) {
      alert('Failed to delete asset: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteFile = async (assetId, fileField, label) => {
    if (!window.confirm(`Delete ${label} file?`)) return;
    try {
      await assets.deleteFile(assetId, fileField);
      toast(`${label} deleted`);
      setShowFilesModal(prev => ({ ...prev, [fileField]: null }));
      loadData();
    } catch (err) {
      alert('Failed to delete file: ' + (err.response?.data?.message || err.message));
    }
  };

  const getFileUrl = (filePath) => {
    const p = filePath.replace(/\\/g, '/');
    const rel = p.includes('uploads/') ? p.substring(p.indexOf('uploads/')) : p;
    return `http://localhost:5000/${rel}`;
  };

  const isImage = (filePath) => /\.(jpg|jpeg|png|gif)$/i.test(filePath);

  const toggleSelect = (asset) => {
    setSelectedAssets(prev =>
      prev.find(a => a.id === asset.id) ? prev.filter(a => a.id !== asset.id) : [...prev, asset]
    );
  };

  const toggleSelectAll = () => {
    setSelectedAssets(prev => prev.length === assetList.length ? [] : [...assetList]);
  };

  const canConfirmTesting = user?.role === 'Admin' || user?.role === 'Manager';
  const canDelete = user?.role === 'Admin';
  const canCreateBranch = user?.role === 'Admin';
  const canCreateSupplier = user?.role === 'Admin' || user?.role === 'Manager';

  return (
    <div className="page">
      <header className="page-header">
        <h1>Assets Management</h1>
        <div>
          <button onClick={() => navigate('/dashboard')}>← Back</button>
          {selectedAssets.length > 0 && (
            <button onClick={() => setShowBulkQR(true)} style={{ marginRight: '8px', background: 'linear-gradient(135deg, #805ad5, #6b46c1)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontWeight: 600 }}>🖨 Bulk QR ({selectedAssets.length})</button>
          )}
          <button onClick={() => navigate('/qr-scanner')} style={{ marginRight: '8px', background: 'linear-gradient(135deg, #dd6b20, #c05621)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontWeight: 600 }}>📷 Scan QR</button>
          <button onClick={() => navigate('/assets/bulk')} style={{ marginRight: '8px', background: 'linear-gradient(135deg, #38a169, #276749)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', fontWeight: 600 }}>📦 Bulk Create</button>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ Add Asset</button>
        </div>
      </header>

      <div className="filters">
        <div className="search-wrapper">
          <span className="search-icon"></span>
          <input 
            type="text" 
            placeholder="Search by ID, name, serial number, supplier, type..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPagination({ ...pagination, page: 1 }); }}
          />
        </div>
        <select value={searchParams.get('type') || filters.asset_type} onChange={(e) => { setFilters({ ...filters, asset_type: e.target.value }); navigate('/assets'); setPagination({ ...pagination, page: 1 }); }}>
          <option value="">All Types</option>
          <option value="HSDC">HSDC</option>
          <option value="COMPUTER">Computer</option>
          <option value="ELECTRICAL">Electrical</option>
          <option value="OFFICE">Office</option>
          <option value="FURNITURE">Furniture</option>
          <option value="FIREFIGHTING">Fire-Fighting</option>
          <option value="BUILDING">Building</option>
        </select>
        <select value={searchParams.get('status') || filters.current_status} onChange={(e) => { setFilters({ ...filters, current_status: e.target.value }); navigate('/assets'); setPagination({ ...pagination, page: 1 }); }}>
          <option value="">All Status</option>
          <option value="Working">Working</option>
          <option value="Not Working">Not Working</option>
          <option value="Obsolete">Obsolete</option>
        </select>
        {(filters.asset_type || filters.current_status || searchParams.get('testing')) && (
          <button onClick={() => { setFilters({ asset_type: '', current_status: '' }); setSearch(''); navigate('/assets'); }} style={{ padding: '12px 20px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>✕ Clear Filters</button>
        )}
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading">Loading assets...</div>
        ) : (
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input type="checkbox" checked={selectedAssets.length === assetList.length && assetList.length > 0} onChange={toggleSelectAll} />
              </th>
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
              <th>Serial No.</th>
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
            {assetList.length === 0 ? (
              <tr><td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>No assets found</td></tr>
            ) : assetList.map((asset) => (
              <tr key={asset.id}>
                <td><input type="checkbox" checked={!!selectedAssets.find(a => a.id === asset.id)} onChange={() => toggleSelect(asset)} /></td>
                <td>{asset.asset_id}</td>
                <td>{asset.name}</td>
                <td>{asset.asset_type}</td>
                <td>{asset.branch?.name}</td>
                <td>{asset.serial_number || '-'}</td>
                <td>{asset.supplier?.name || '-'}</td>
                <td><span className={`badge ${asset.current_status.toLowerCase().replace(' ', '-')}`}>{asset.current_status}</span></td>
                <td><span className={`badge ${asset.testing_status.toLowerCase()}`}>{asset.testing_status}</span></td>
                <td>₹{asset.purchase_value?.toLocaleString()}</td>
                <td>
                  <button onClick={() => setShowQRModal(asset)} className="btn-sm" style={{ marginRight: '8px', background: 'linear-gradient(135deg, #805ad5, #6b46c1)' }}>QR</button>
                  {(asset.invoice_file || asset.po_file || asset.dc_file || asset.testing_report_file) && (
                    <button onClick={() => setShowFilesModal(asset)} className="btn-sm" style={{ marginRight: '8px', background: 'linear-gradient(135deg, #3182ce, #2b6cb0)' }}>📎 Files</button>
                  )}
                  <button onClick={() => handleEdit(asset)} className="btn-sm" style={{ marginRight: '8px' }}>Edit</button>
                  {canConfirmTesting && asset.testing_status === 'Pending' && (
                    <button onClick={() => setShowTestingForm(asset.id)} className="btn-sm" style={{ marginRight: '8px' }}>Test</button>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDelete(asset)} className="btn-sm btn-danger">Delete</button>
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
                    <option value="BUILDING">Building</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Branch *</label>
                  <SearchableSelect
                    options={branches.map(b => ({ value: b.id, label: b.name }))}
                    value={formData.branch_id}
                    onChange={(v) => setFormData({ ...formData, branch_id: v })}
                    placeholder="Select Branch"
                    required
                    extraOption={canCreateBranch ? { label: '+ Add New Branch', onClick: () => setShowBranchForm(true) } : null}
                  />
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
                  <label>Serial Number</label>
                  <input value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })} placeholder="e.g., SN-12345" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Supplier</label>
                  <SearchableSelect
                    options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                    value={formData.supplier_id}
                    onChange={(v) => setFormData({ ...formData, supplier_id: v })}
                    placeholder="Select Supplier"
                    extraOption={canCreateSupplier ? { label: '+ Add New Supplier', onClick: () => setShowSupplierForm(true) } : null}
                  />
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

      {showSupplierForm && (
        <div className="modal">
          <div className="modal-content small">
            <h2>Add New Supplier</h2>
            <form onSubmit={handleAddSupplier}>
              <div className="form-group">
                <label>Supplier Name *</label>
                <input value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} placeholder="e.g., ABC Technologies" required />
              </div>
              <div className="form-group">
                <label>Contact Person *</label>
                <input value={newSupplier.contact_person} onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })} placeholder="e.g., John Doe" required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} placeholder="contact@supplier.com" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} placeholder="+91 9876543210" />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea value={newSupplier.address} onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })} rows="3" placeholder="Enter supplier address"></textarea>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowSupplierForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFilesModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>📎 Attached Files — {showFilesModal.asset_id}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {[{ key: 'invoice_file', label: 'Invoice' }, { key: 'po_file', label: 'Purchase Order' }, { key: 'dc_file', label: 'Delivery Challan' }, { key: 'testing_report_file', label: 'Testing Report' }]
                .filter(f => showFilesModal[f.key])
                .map(f => {
                  const url = getFileUrl(showFilesModal[f.key]);
                  const isPdf = /\.pdf$/i.test(showFilesModal[f.key]);
                  const isImg = isImage(showFilesModal[f.key]);
                  return (
                    <div key={f.key} style={{ border: '2px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 18px', background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
                        <span style={{ fontWeight: 700, color: '#2d3748' }}>📄 {f.label}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 14px', background: '#667eea', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>View</a>
                          <a href={`http://localhost:5000/api/assets/${showFilesModal.id}/file/${f.key}/download`} style={{ padding: '6px 14px', background: '#38a169', color: 'white', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>Download</a>
                          {canDelete && (
                            <button onClick={() => handleDeleteFile(showFilesModal.id, f.key, f.label)} style={{ padding: '6px 14px', background: '#e53e3e', color: 'white', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', width: 'auto' }}>Delete</button>
                          )}
                        </div>
                      </div>
                      <div style={{ padding: '12px', background: 'white', maxHeight: '300px', overflow: 'auto' }}>
                        {isImg && <img src={url} alt={f.label} style={{ maxWidth: '100%', borderRadius: '6px' }} />}
                        {isPdf && <iframe src={url} title={f.label} style={{ width: '100%', height: '280px', border: 'none', borderRadius: '6px' }} />}
                        {!isImg && !isPdf && <p style={{ color: '#718096', textAlign: 'center', padding: '20px' }}>Preview not available — use Preview button to open</p>}
                      </div>
                    </div>
                  );
                })}
              {![showFilesModal.invoice_file, showFilesModal.po_file, showFilesModal.dc_file, showFilesModal.testing_report_file].some(Boolean) && (
                <p style={{ textAlign: 'center', color: '#718096', padding: '30px' }}>All files have been removed</p>
              )}
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setShowFilesModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {showQRModal && <AssetQRModal asset={showQRModal} onClose={() => setShowQRModal(null)} />}
      {showBulkQR && <BulkQRPrint selectedAssets={selectedAssets} onClose={() => setShowBulkQR(false)} />}
    </div>
  );
}
