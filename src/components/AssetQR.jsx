import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export function AssetQRModal({ asset, onClose }) {
  const qrRef = useRef();

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_${asset.asset_id}.png`;
    a.click();
  };

  const printLabel = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const qrDataUrl = canvas.toDataURL('image/png');
    const w = window.open('', '', 'width=400,height=500');
    w.document.write(`<html><head><title>Label - ${asset.asset_id}</title><style>
      body { font-family: Arial, sans-serif; margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
      .label { border: 2px solid #000; padding: 16px; width: 280px; text-align: center; }
      .label img.logo { width: 60px; margin-bottom: 8px; }
      .label img.qr { width: 160px; height: 160px; margin: 8px 0; }
      .label .asset-id { font-size: 14px; font-weight: bold; letter-spacing: 1px; margin: 4px 0; }
      .label .asset-name { font-size: 12px; color: #333; margin: 2px 0; }
      .label .branch { font-size: 11px; color: #666; margin: 2px 0; }
      @media print { body { margin: 0; } }
    </style></head><body>
      <div class="label">
        <img class="logo" src="${window.location.origin}/stpi-logo.png" alt="STPI" onerror="this.style.display='none'" />
        <img class="qr" src="${qrDataUrl}" alt="QR Code" />
        <div class="asset-id">${asset.asset_id}</div>
        <div class="asset-name">${asset.name}</div>
        <div class="branch">${asset.branch?.name || ''}</div>
      </div>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <div className="modal">
      <div className="modal-content small" style={{ textAlign: 'center' }}>
        <h2>QR Code — {asset.asset_id}</h2>
        <div ref={qrRef} style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
          <QRCodeCanvas value={asset.asset_id} size={200} level="H" includeMargin />
        </div>
        <p style={{ fontSize: '13px', color: '#718096', marginBottom: '20px' }}>
          {asset.name} · {asset.branch?.name}
        </p>
        <div className="form-actions" style={{ justifyContent: 'center' }}>
          <button type="button" onClick={onClose}>Close</button>
          <button onClick={downloadQR} className="btn-primary" style={{ background: 'linear-gradient(135deg, #38a169, #276749)' }}>⬇ Download QR</button>
          <button onClick={printLabel} className="btn-primary">🖨 Print Label</button>
        </div>
      </div>
    </div>
  );
}

export function BulkQRPrint({ selectedAssets, onClose }) {
  const printAll = () => {
    const canvases = document.querySelectorAll('.bulk-qr-canvas canvas');
    const labels = Array.from(canvases).map((canvas, i) => {
      const asset = selectedAssets[i];
      return `
        <div class="label">
          <img class="logo" src="${window.location.origin}/stpi-logo.png" alt="STPI" onerror="this.style.display='none'" />
          <img class="qr" src="${canvas.toDataURL('image/png')}" alt="QR" />
          <div class="asset-id">${asset.asset_id}</div>
          <div class="asset-name">${asset.name}</div>
          <div class="branch">${asset.branch?.name || ''}</div>
        </div>`;
    }).join('');

    const w = window.open('', '', 'width=900,height=700');
    w.document.write(`<html><head><title>Bulk QR Labels</title><style>
      body { font-family: Arial, sans-serif; margin: 16px; }
      .grid { display: flex; flex-wrap: wrap; gap: 16px; }
      .label { border: 2px solid #000; padding: 12px; width: 180px; text-align: center; }
      .label img.logo { width: 40px; margin-bottom: 6px; }
      .label img.qr { width: 120px; height: 120px; margin: 6px 0; }
      .label .asset-id { font-size: 11px; font-weight: bold; letter-spacing: 1px; margin: 3px 0; }
      .label .asset-name { font-size: 10px; color: #333; margin: 2px 0; }
      .label .branch { font-size: 9px; color: #666; }
      @media print { body { margin: 0; } }
    </style></head><body>
      <div class="grid">${labels}</div>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  return (
    <div className="modal">
      <div className="modal-content" style={{ maxWidth: '700px' }}>
        <h2>Bulk Print QR Labels ({selectedAssets.length} assets)</h2>
        <div className="bulk-qr-canvas" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', margin: '20px 0', maxHeight: '400px', overflowY: 'auto' }}>
          {selectedAssets.map(asset => (
            <div key={asset.id} style={{ textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', width: '140px' }}>
              <QRCodeCanvas value={asset.asset_id} size={100} level="H" includeMargin />
              <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '6px' }}>{asset.asset_id}</div>
              <div style={{ fontSize: '10px', color: '#718096' }}>{asset.name}</div>
            </div>
          ))}
        </div>
        <div className="form-actions">
          <button type="button" onClick={onClose}>Close</button>
          <button onClick={printAll} className="btn-primary">🖨 Print All Labels</button>
        </div>
      </div>
    </div>
  );
}
