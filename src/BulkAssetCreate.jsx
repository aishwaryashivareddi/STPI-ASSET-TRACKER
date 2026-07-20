import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { assets, master } from './api';
import SearchableSelect from './components/SearchableSelect';
import { useToast } from './components/Toast';

const ASSET_TYPES = ['HSDC', 'COMPUTER', 'ELECTRICAL', 'OFFICE', 'FURNITURE', 'FIREFIGHTING', 'BUILDING'];

const TEMPLATE_HEADERS = ['name', 'asset_type', 'branch_id', 'location', 'purchase_value', 'po_number', 'serial_number', 'supplier_id', 'warranty_expiry'];
const TEMPLATE_EXAMPLE = ['Office Chair', 'FURNITURE', '1', 'Room 101', '5000', 'PO-2025-001', 'SN-001', '', '2027-12-31'];

export default function BulkAssetCreate() {
  const [tab, setTab] = useState('quantity'); // 'quantity' | 'import'
  const [branches, setBranches] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { count, asset_ids, errors }
  const navigate = useNavigate();
  const toast = useToast();

  // Quantity tab state
  const [form, setForm] = useState({
    name: '', asset_type: 'FURNITURE', branch_id: '', quantity: 2,
    location: '', purchase_value: '', po_number: '', supplier_id: '', warranty_expiry: ''
  });

  // Import tab state
  const [importFile, setImportFile] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const fileInputRef = useRef();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) { navigate('/'); return; }
    Promise.all([master.getBranches(), master.getSuppliers()]).then(([b, s]) => {
      setBranches(b.data.data);
      setSuppliers(s.data.data);
    });
  }, [navigate]);

  const handleQuantitySubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(form.quantity);
    if (!qty || qty < 2 || qty > 500) return toast('Quantity must be between 2 and 500', 'error');
    if (!window.confirm(`Create ${qty} assets named "${form.name}"?`)) return;

    setLoading(true);
    try {
      const res = await assets.bulkCreate(form);
      const { count, asset_ids } = res.data.data;
      setResult({ count, asset_ids, errors: [] });
      toast(`${count} assets created successfully`);
    } catch (err) {
      toast(err.response?.data?.message || 'Bulk create failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return toast('Please select a file', 'error');
    setImportErrors([]);

    const formData = new FormData();
    formData.append('file', importFile);

    setLoading(true);
    try {
      const res = await assets.bulkImport(formData);
      const { count, asset_ids, errors } = res.data.data;
      setResult({ count, asset_ids, errors: errors || [] });
      if (errors?.length) setImportErrors(errors);
      toast(`${count} assets imported${errors?.length ? `, ${errors.length} rows skipped` : ''}`);
    } catch (err) {
      toast(err.response?.data?.message || 'Import failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = [TEMPLATE_HEADERS.join(','), TEMPLATE_EXAMPLE.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_asset_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const printAllQR = () => {
    const canvases = document.querySelectorAll('.result-qr-grid canvas');
    const labels = Array.from(canvases).map((canvas, i) => {
      const id = result.asset_ids[i];
      return `<div class="label">
        <img class="logo" src="${window.location.origin}/stpi-logo.png" alt="STPI" onerror="this.style.display='none'" />
        <img class="qr" src="${canvas.toDataURL('image/png')}" alt="QR" />
        <div class="asset-id">${id}</div>
      </div>`;
    }).join('');

    const w = window.open('', '', 'width=900,height=700');
    w.document.write(`<html><head><title>QR Labels</title><style>
      body { font-family: Arial, sans-serif; margin: 16px; }
      .grid { display: flex; flex-wrap: wrap; gap: 12px; }
      .label { border: 2px solid #000; padding: 10px; width: 160px; text-align: center; }
      .label img.logo { width: 36px; margin-bottom: 4px; }
      .label img.qr { width: 120px; height: 120px; margin: 4px 0; }
      .label .asset-id { font-size: 10px; font-weight: bold; letter-spacing: 1px; }
      @media print { body { margin: 0; } }
    </style></head><body><div class="grid">${labels}</div></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Bulk Asset Creation</h1>
        <button onClick={() => navigate('/assets')}>← Back to Assets</button>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '2px solid #e2e8f0' }}>
        {[['quantity', '📦 Bulk by Quantity'], ['import', '📂 Import from Excel/CSV']].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setResult(null); setImportErrors([]); }}
            style={{ padding: '12px 24px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
              borderBottom: tab === key ? '3px solid #667eea' : '3px solid transparent',
              color: tab === key ? '#667eea' : '#718096' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Result Panel */}
      {result && (
        <div style={{ background: '#f0fff4', border: '2px solid #38a169', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#276749' }}>✅ {result.count} Assets Created</h3>
              {result.errors.length > 0 && (
                <p style={{ margin: '4px 0 0', color: '#c05621', fontSize: '13px' }}>{result.errors.length} rows skipped due to errors</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={printAllQR} className="btn-primary">🖨 Print All QR Labels</button>
              <button onClick={() => navigate('/assets')} style={{ padding: '10px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>View in Assets</button>
              <button onClick={() => setResult(null)} style={{ padding: '10px 16px', background: '#e2e8f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Create More</button>
            </div>
          </div>

          {/* QR Grid */}
          <div className="result-qr-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
            {result.asset_ids.map((id) => (
              <div key={id} style={{ textAlign: 'center', border: '1px solid #c6f6d5', borderRadius: '8px', padding: '10px', background: 'white', width: '130px' }}>
                <QRCodeCanvas value={id} size={90} level="H" includeMargin />
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '6px', wordBreak: 'break-all' }}>{id}</div>
              </div>
            ))}
          </div>

          {/* Import errors */}
          {result.errors.length > 0 && (
            <div style={{ marginTop: '16px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', padding: '12px' }}>
              <strong style={{ color: '#c53030', fontSize: '13px' }}>Skipped rows:</strong>
              <ul style={{ margin: '8px 0 0', paddingLeft: '20px', fontSize: '12px', color: '#c53030' }}>
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Quantity Tab */}
      {tab === 'quantity' && !result && (
        <div style={{ maxWidth: '700px' }}>
          <p style={{ color: '#718096', marginBottom: '20px', fontSize: '14px' }}>
            Fill in the common details below. Each asset will get a unique auto-generated ID and QR code.
          </p>
          <form onSubmit={handleQuantitySubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Asset Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Office Chair" required />
              </div>
              <div className="form-group">
                <label>Asset Type *</label>
                <select value={form.asset_type} onChange={e => setForm({ ...form, asset_type: e.target.value })} required>
                  {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Branch *</label>
                <SearchableSelect
                  options={branches.map(b => ({ value: b.id, label: b.name }))}
                  value={form.branch_id}
                  onChange={v => setForm({ ...form, branch_id: v })}
                  placeholder="Select Branch"
                  required
                />
              </div>
              <div className="form-group">
                <label>Quantity * <span style={{ color: '#805ad5', fontSize: '12px' }}>({form.quantity} assets will be created)</span></label>
                <input type="number" min="2" max="500" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Location</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g., Room 101" />
              </div>
              <div className="form-group">
                <label>Purchase Value (₹)</label>
                <input type="number" value={form.purchase_value} onChange={e => setForm({ ...form, purchase_value: e.target.value })} placeholder="e.g., 5000" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>PO Number</label>
                <input value={form.po_number} onChange={e => setForm({ ...form, po_number: e.target.value })} placeholder="e.g., PO-2025-001" />
              </div>
              <div className="form-group">
                <label>Supplier</label>
                <SearchableSelect
                  options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                  value={form.supplier_id}
                  onChange={v => setForm({ ...form, supplier_id: v })}
                  placeholder="Select Supplier"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Warranty Expiry</label>
                <input type="date" value={form.warranty_expiry} onChange={e => setForm({ ...form, warranty_expiry: e.target.value })} />
              </div>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #f6e05e', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '13px', color: '#744210' }}>
              ⚠ File attachments (Invoice, PO, DC) are not supported during bulk creation. You can attach files individually after creation.
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => navigate('/assets')}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : `Create ${form.quantity || ''} Assets`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Import Tab */}
      {tab === 'import' && !result && (
        <div style={{ maxWidth: '700px' }}>
          <div style={{ background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
            <strong style={{ color: '#2b6cb0', fontSize: '14px' }}>📋 How to Import</strong>
            <ol style={{ margin: '8px 0 0', paddingLeft: '20px', fontSize: '13px', color: '#2c5282', lineHeight: '1.8' }}>
              <li>Download the CSV template below</li>
              <li>Fill in your asset data (one row per asset)</li>
              <li>Required columns: <code>name</code>, <code>asset_type</code>, <code>branch_id</code></li>
              <li>Valid asset types: <code>{ASSET_TYPES.join(', ')}</code></li>
              <li>Upload the filled file and click Import</li>
            </ol>
            <button onClick={downloadTemplate} style={{ marginTop: '12px', padding: '8px 16px', background: '#2b6cb0', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
              ⬇ Download CSV Template
            </button>
          </div>

          {/* Branch reference */}
          {branches.length > 0 && (
            <div style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '12px' }}>
              <strong>Branch IDs for reference:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                {branches.map(b => (
                  <span key={b.id} style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>
                    {b.name} → ID: <strong>{b.id}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleImportSubmit}>
            <div className="form-group">
              <label>Select Excel (.xlsx, .xls) or CSV file *</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={e => setImportFile(e.target.files[0] || null)}
                required
              />
              {importFile && (
                <div style={{ marginTop: '6px', fontSize: '13px', color: '#38a169' }}>
                  ✓ {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {importErrors.length > 0 && (
              <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <strong style={{ color: '#c53030', fontSize: '13px' }}>Previous import errors:</strong>
                <ul style={{ margin: '8px 0 0', paddingLeft: '20px', fontSize: '12px', color: '#c53030' }}>
                  {importErrors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/assets')}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading || !importFile}>
                {loading ? 'Importing...' : '📂 Import Assets'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
