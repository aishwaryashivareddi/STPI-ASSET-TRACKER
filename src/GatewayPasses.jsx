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
  const [showPrintModal, setShowPrintModal] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({ asset_id: '', to_branch_id: '', reason: '', transfer_date: '', pass_through_person: '', prepared_by_person: '', authorized_by_person: '', received_by_person: '' });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) { navigate('/'); return; }
    setUser(userData);
  }, [navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { loadData(); }, [debouncedSearch, pagination.page]);

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
      const gpRes = await gatewayPasses.getAll({ search: debouncedSearch, page: pagination.page, limit: pagination.limit });
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
      setFormData({ asset_id: '', to_branch_id: '', reason: '', transfer_date: '', pass_through_person: '', prepared_by_person: '', authorized_by_person: '', received_by_person: '' });
      toast('Gateway pass created & asset transferred');
      loadData();
    } catch (err) {
      toast('Failed: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete gateway pass "${item.gateway_pass_id}"?`)) return;
    try {
      await gatewayPasses.delete(item.id);
      toast('Gateway pass deleted');
      loadData();
    } catch (err) {
      toast('Failed to delete: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleDownloadPDF = async (item) => {
    try {
      const res = await gatewayPasses.downloadPDF(item.id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `GatePass_${item.gateway_pass_id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) { toast('Failed to download PDF', 'error'); }
  };

  const canDelete = user?.role === 'Admin';

  return (
    <div className="page">
      <header className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/stpi-logo.png" alt="STPI Logo" style={{ width: '48px', height: '48px' }} />
          <h1>Gateway Pass - Asset Transfer</h1>
        </div>
        <div>
          <button onClick={() => navigate('/dashboard')}>← Back</button>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ New Gateway Pass</button>
        </div>
      </header>

      <div className="filters">
        <div className="search-wrapper">
          <span className="search-icon"></span>
          <input type="text" placeholder="Search by ID, reason..." value={search} onChange={(e) => { setSearch(e.target.value); setPagination({ ...pagination, page: 1 }); }} />
        </div>
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
              <th>Requested By</th>
              <th>Transfer Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>No gateway passes found</td></tr>
            ) : list.map((item) => (
              <tr key={item.id}>
                <td>{item.gateway_pass_id}</td>
                <td>{item.asset?.name}</td>
                <td>{item.fromBranch?.name} → {item.toBranch?.name}</td>
                <td>{item.creator?.username}</td>
                <td>{new Date(item.transfer_date).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => setShowPrintModal(item)} className="btn-sm" style={{ marginRight: '4px', background: 'linear-gradient(135deg, #2d3748, #1a202c)' }}>Print</button>
                  <button onClick={() => handleDownloadPDF(item)} className="btn-sm" style={{ marginRight: '4px', background: 'linear-gradient(135deg, #2b6cb0, #2c5282)' }}>⬇ PDF</button>
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
              <div className="form-group">
                <label>Please Pass Out the Items Through *</label>
                <input type="text" value={formData.pass_through_person} onChange={(e) => setFormData({ ...formData, pass_through_person: e.target.value })} placeholder="Name of the person" required />
              </div>
              <div className="form-group">
                <label>Prepared By *</label>
                <input type="text" value={formData.prepared_by_person} onChange={(e) => setFormData({ ...formData, prepared_by_person: e.target.value })} placeholder="Name of the person" required />
              </div>
              <div className="form-group">
                <label>Authorized By *</label>
                <input type="text" value={formData.authorized_by_person} onChange={(e) => setFormData({ ...formData, authorized_by_person: e.target.value })} placeholder="Name of the person" required />
              </div>
              <div className="form-group">
                <label>Received By *</label>
                <input type="text" value={formData.received_by_person} onChange={(e) => setFormData({ ...formData, received_by_person: e.target.value })} placeholder="Name of the person" required />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Gateway Pass</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPrintModal && (
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div id="gate-pass-print" style={{ fontFamily: 'serif', padding: '30px', border: '2px solid #000' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px' }}>
                <img src="/stpi-logo.png" alt="STPI Logo" style={{ width: '60px', height: '60px', marginRight: '16px' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <h3 style={{ margin: 0 }}>सॉफ्टवेयर टेक्नोलॉजी पार्क्स ऑफ इंडिया</h3>
                  <h3 style={{ margin: '4px 0' }}>Software Technology Parks of India</h3>
                  <p style={{ fontSize: '11px', margin: '4px 0' }}>(An Autonomous Society under Ministry of Electronics and Information Technology, Govt. of India)</p>
                  <p style={{ fontSize: '12px', margin: '4px 0' }}>6Q3, 6th Floor, Cyber Towers, HITEC City, Madhapur, Hyderabad-500 081.</p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span><strong>Sl.No.:</strong> {showPrintModal.gateway_pass_id}</span>
                <span><strong>प्रवेश पत्र / GATE PASS</strong></span>
                <span><strong>Date:</strong> {new Date(showPrintModal.transfer_date).toLocaleDateString('en-IN')}</span>
              </div>
              <ol style={{ fontSize: '13px', lineHeight: '2' }}>
                <li>Please pass out the following items through: <strong>{showPrintModal.pass_through_person || '—'}</strong></li>
                <li><strong>Name/Organisation:</strong> {showPrintModal.fromBranch?.name} → {showPrintModal.toBranch?.name}</li>
                <li>These items will be returned / <strong>will not be returned</strong>*</li>
              </ol>
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '16px 0', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #000', padding: '8px' }}>S.No.</th>
                    <th style={{ border: '1px solid #000', padding: '8px' }}>Name of the Item</th>
                    <th style={{ border: '1px solid #000', padding: '8px' }}>Qty.</th>
                    <th style={{ border: '1px solid #000', padding: '8px' }}>Expected Date of return</th>
                    <th style={{ border: '1px solid #000', padding: '8px' }}>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>1</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{showPrintModal.asset?.name} ({showPrintModal.asset?.asset_id})</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>1</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>N/A</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{showPrintModal.reason}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', fontSize: '13px' }}>
                <div><strong>4. Prepared by:</strong><br/>{showPrintModal.prepared_by_person || showPrintModal.creator?.username}</div>
                <div><strong>5. Authorised by:</strong><br/>{showPrintModal.authorized_by_person || ''}</div>
                <div><strong>6. Received by:</strong><br/>{showPrintModal.received_by_person || ''}</div>
              </div>
              <p style={{ fontSize: '11px', marginTop: '20px' }}>*Strike out which is not applicable</p>
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setShowPrintModal(null)}>Close</button>
              <button onClick={() => handleDownloadPDF(showPrintModal)} className="btn-primary" style={{ marginRight: '8px' }}>⬇ PDF</button>
              <button onClick={() => {
                const logoUrl = window.location.origin + '/stpi-logo.png';
                const w = window.open('', '', 'width=800,height=600');
                w.document.write(`<html><head><title>Gate Pass - ${showPrintModal.gateway_pass_id}</title><style>
                  body { font-family: serif; margin: 0; padding: 20px; }
                  .print-container { padding: 30px; border: 2px solid #000; }
                  .header { display: flex; align-items: flex-start; margin-bottom: 20px; }
                  .header img { width: 60px; height: 60px; margin-right: 16px; }
                  .header-text { text-align: center; flex: 1; }
                  .header-text h3 { margin: 0 0 4px 0; }
                  .header-text p { margin: 4px 0; font-size: 11px; }
                  .meta { display: flex; justify-content: space-between; margin-bottom: 16px; }
                  ol { font-size: 13px; line-height: 2; }
                  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
                  th, td { border: 1px solid #000; padding: 8px; }
                  .signatures { display: flex; justify-content: space-between; margin-top: 40px; font-size: 13px; }
                  .note { font-size: 11px; margin-top: 20px; }
                  @media print { body { margin: 0; } }
                </style></head><body>
                  <div class="print-container">
                    <div class="header">
                      <img src="${logoUrl}" alt="STPI Logo" />
                      <div class="header-text">
                        <h3>सॉफ्टवेयर टेक्नोलॉजी पार्क्स ऑफ इंडिया</h3>
                        <h3>Software Technology Parks of India</h3>
                        <p>(An Autonomous Society under Ministry of Electronics and Information Technology, Govt. of India)</p>
                        <p style="font-size:12px">6Q3, 6th Floor, Cyber Towers, HITEC City, Madhapur, Hyderabad-500 081.</p>
                      </div>
                    </div>
                    <div class="meta">
                      <span><strong>Sl.No.:</strong> ${showPrintModal.gateway_pass_id}</span>
                      <span><strong>प्रवेश पत्र / GATE PASS</strong></span>
                      <span><strong>Date:</strong> ${new Date(showPrintModal.transfer_date).toLocaleDateString('en-IN')}</span>
                    </div>
                    <ol>
                      <li>Please pass out the following items through: <strong>${showPrintModal.pass_through_person || '—'}</strong></li>
                      <li><strong>Name/Organisation:</strong> ${showPrintModal.fromBranch?.name || ''} → ${showPrintModal.toBranch?.name || ''}</li>
                      <li>These items will be returned / <strong>will not be returned</strong>*</li>
                    </ol>
                    <table>
                      <thead><tr><th>S.No.</th><th>Name of the Item</th><th>Qty.</th><th>Expected Date of return</th><th>Purpose</th></tr></thead>
                      <tbody><tr>
                        <td style="text-align:center">1</td>
                        <td>${showPrintModal.asset?.name || ''} (${showPrintModal.asset?.asset_id || ''})</td>
                        <td style="text-align:center">1</td>
                        <td style="text-align:center">N/A</td>
                        <td>${showPrintModal.reason || ''}</td>
                      </tr></tbody>
                    </table>
                    <div class="signatures">
                      <div><strong>4. Prepared by:</strong><br/>${showPrintModal.prepared_by_person || showPrintModal.creator?.username || ''}</div>
                      <div><strong>5. Authorised by:</strong><br/>${showPrintModal.authorized_by_person || ''}</div>
                      <div><strong>6. Received by:</strong><br/>${showPrintModal.received_by_person || ''}</div>
                    </div>
                    <p class="note">*Strike out which is not applicable</p>
                  </div>
                </body></html>`);
                w.document.close();
                setTimeout(() => w.print(), 300);
              }} className="btn-primary">🖨 Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
