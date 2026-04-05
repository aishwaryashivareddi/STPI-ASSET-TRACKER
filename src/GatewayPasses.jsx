import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gatewayPasses, assets, master } from './api';
import Pagination from './components/Pagination';
import { useToast } from './components/Toast';
import SearchableSelect from './components/SearchableSelect';

export default function GatewayPasses() {
  const [list, setList] = useState([]);
  const [assetList, setAssetList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({ asset_id: '', to_branch_id: '', reason: '', transfer_date: '' });
  const [approvalData, setApprovalData] = useState({ status: 'Approved', remarks: '' });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) { navigate('/'); return; }
    setUser(userData);
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { loadData(); }, [debouncedSearch, statusFilter, pagination.page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const branchRes = await master.getBranches();
      setBranches(branchRes.data.data);
    } catch (e) {}
    try {
      const assetRes = await assets.getAll({ limit: 9999 });
      setAssetList(assetRes.data.data.assets);
    } catch (e) { console.error('Failed to load assets:', e); }
    try {
      const gpRes = await gatewayPasses.getAll({ search: debouncedSearch, status: statusFilter, page: pagination.page, limit: pagination.limit });
      setList(gpRes.data.data.gatewayPasses);
      setPagination(gpRes.data.data.pagination);
    } catch (e) { console.error('Failed to load gateway passes:', e); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await gatewayPasses.create(formData);
      setShowForm(false);
      setFormData({ asset_id: '', to_branch_id: '', reason: '', transfer_date: '' });
      toast('Gateway pass created');
      loadData();
    } catch (err) {
      alert('Failed to create gateway pass: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleApproval = async (id, level) => {
    try {
      if (level === 'manager') await gatewayPasses.managerApprove(id, approvalData);
      else if (level === 'admin') await gatewayPasses.adminApprove(id, approvalData);
      else if (level === 'receiver') await gatewayPasses.receiverConfirm(id, { status: approvalData.status === 'Approved' ? 'Received' : 'Rejected', remarks: approvalData.remarks });
      setShowApprovalModal(null);
      setApprovalData({ status: 'Approved', remarks: '' });
      toast('Approval updated successfully');
      loadData();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete gateway pass "${item.gateway_pass_id}"?`)) return;
    try {
      await gatewayPasses.delete(item.id);
      toast('Gateway pass deleted');
      loadData();
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.message || err.message));
    }
  };

  const canManagerApprove = user?.role === 'Admin' || user?.role === 'Manager';
  const canAdminApprove = user?.role === 'Admin';
  const canDelete = user?.role === 'Admin';

  const getStatusBadge = (item) => {
    if (item.status === 'Rejected') return <span className="badge failed">Rejected</span>;
    if (item.status === 'Completed') return <span className="badge passed">Completed</span>;
    if (item.status === 'Admin Approved') return <span className="badge approved">Awaiting Receipt</span>;
    if (item.status === 'Manager Approved') return <span className="badge scheduled">Awaiting Admin</span>;
    return <span className="badge pending">Awaiting Manager</span>;
  };

  const getApprovalSteps = (item) => (
    <div style={{ display: 'flex', gap: '4px', fontSize: '11px' }}>
      <span title="Manager" style={{ padding: '2px 6px', borderRadius: '4px', background: item.manager_status === 'Approved' ? '#c6f6d5' : item.manager_status === 'Rejected' ? '#fed7d7' : '#feebc8', color: item.manager_status === 'Approved' ? '#22543d' : item.manager_status === 'Rejected' ? '#742a2a' : '#7c2d12' }}>
        L1 {item.manager_status === 'Approved' ? '✓' : item.manager_status === 'Rejected' ? '✗' : '…'}
      </span>
      <span title="Admin" style={{ padding: '2px 6px', borderRadius: '4px', background: item.admin_status === 'Approved' ? '#c6f6d5' : item.admin_status === 'Rejected' ? '#fed7d7' : '#feebc8', color: item.admin_status === 'Approved' ? '#22543d' : item.admin_status === 'Rejected' ? '#742a2a' : '#7c2d12' }}>
        L2 {item.admin_status === 'Approved' ? '✓' : item.admin_status === 'Rejected' ? '✗' : '…'}
      </span>
      <span title="Receiver" style={{ padding: '2px 6px', borderRadius: '4px', background: item.receiver_status === 'Received' ? '#c6f6d5' : item.receiver_status === 'Rejected' ? '#fed7d7' : '#feebc8', color: item.receiver_status === 'Received' ? '#22543d' : item.receiver_status === 'Rejected' ? '#742a2a' : '#7c2d12' }}>
        L3 {item.receiver_status === 'Received' ? '✓' : item.receiver_status === 'Rejected' ? '✗' : '…'}
      </span>
    </div>
  );

  return (
    <div className="page">
      <header className="page-header">
        <h1>Gateway Pass - Asset Transfer</h1>
        <div>
          <button onClick={() => navigate('/dashboard')}>← Back</button>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ New Transfer</button>
        </div>
      </header>

      <div className="filters">
        <div className="search-wrapper">
          <span className="search-icon"></span>
          <input type="text" placeholder="Search by ID, reason..." value={search} onChange={(e) => { setSearch(e.target.value); setPagination({ ...pagination, page: 1 }); }} />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPagination({ ...pagination, page: 1 }); }}>
          <option value="">All Status</option>
          <option value="Pending">Pending (Awaiting Manager)</option>
          <option value="Manager Approved">Manager Approved (Awaiting Admin)</option>
          <option value="Admin Approved">Admin Approved (Awaiting Receipt)</option>
          <option value="Completed">Completed</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading">Loading gateway passes...</div>
        ) : (
        <table>
          <thead>
            <tr>
              <th>Pass ID</th>
              <th>Asset</th>
              <th>From → To</th>
              <th>Transfer Date</th>
              <th>Approval Progress</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>No gateway passes found</td></tr>
            ) : list.map((item) => (
              <tr key={item.id}>
                <td>{item.gateway_pass_id}</td>
                <td>{item.asset?.name}</td>
                <td>{item.fromBranch?.name} → {item.toBranch?.name}</td>
                <td>{new Date(item.transfer_date).toLocaleDateString()}</td>
                <td>{getApprovalSteps(item)}</td>
                <td>{getStatusBadge(item)}</td>
                <td>
                  {canManagerApprove && item.status === 'Pending' && (
                    <button onClick={() => setShowApprovalModal({ id: item.id, level: 'manager', title: 'Manager Approval (Level 1)' })} className="btn-sm" style={{ marginRight: '8px' }}>L1 Approve</button>
                  )}
                  {canAdminApprove && item.status === 'Manager Approved' && (
                    <button onClick={() => setShowApprovalModal({ id: item.id, level: 'admin', title: 'Admin Approval (Level 2)' })} className="btn-sm" style={{ marginRight: '8px' }}>L2 Approve</button>
                  )}
                  {item.status === 'Admin Approved' && (
                    <button onClick={() => setShowApprovalModal({ id: item.id, level: 'receiver', title: 'Confirm Receipt (Level 3)' })} className="btn-sm" style={{ marginRight: '8px' }}>Receive</button>
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
        <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={(page) => setPagination({ ...pagination, page })} />
      </div>

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h2>New Gateway Pass - Asset Transfer</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Asset *</label>
                <SearchableSelect
                  options={assetList.map(a => ({ value: a.id, label: `${a.asset_id} - ${a.name} (${a.branch?.name || ''})` }))}
                  value={formData.asset_id}
                  onChange={(v) => setFormData({ ...formData, asset_id: v })}
                  placeholder="Select Asset"
                  required
                />
              </div>
              <div className="form-group">
                <label>Destination Branch *</label>
                <SearchableSelect
                  options={branches.map(b => ({ value: b.id, label: b.name }))}
                  value={formData.to_branch_id}
                  onChange={(v) => setFormData({ ...formData, to_branch_id: v })}
                  placeholder="Select Branch"
                  required
                />
              </div>
              <div className="form-group">
                <label>Transfer Date *</label>
                <input type="date" value={formData.transfer_date} onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Reason *</label>
                <textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} rows="3" required></textarea>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Gateway Pass</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showApprovalModal && (
        <div className="modal">
          <div className="modal-content small">
            <h2>{showApprovalModal.title}</h2>
            <div className="form-group">
              <label>Decision *</label>
              <select value={approvalData.status} onChange={(e) => setApprovalData({ ...approvalData, status: e.target.value })}>
                <option value="Approved">{showApprovalModal.level === 'receiver' ? 'Received' : 'Approve'}</option>
                <option value="Rejected">Reject</option>
              </select>
            </div>
            <div className="form-group">
              <label>Remarks</label>
              <textarea value={approvalData.remarks} onChange={(e) => setApprovalData({ ...approvalData, remarks: e.target.value })} rows="3" placeholder="Optional remarks..."></textarea>
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => { setShowApprovalModal(null); setApprovalData({ status: 'Approved', remarks: '' }); }}>Cancel</button>
              <button onClick={() => handleApproval(showApprovalModal.id, showApprovalModal.level)} className="btn-primary">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
