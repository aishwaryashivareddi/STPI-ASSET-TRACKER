import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

// Single QR label for one asset
function QRLabel({ asset, logoUrl }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px', border: '1px solid #000', borderRadius: '8px', width: '180px', background: '#fff', gap: '6px' }}>
      {logoUrl && <img src={logoUrl} alt="STPI" style={{ height: '30px', objectFit: 'contain' }} />}
      <QRCodeCanvas value={asset.asset_id} size={120} level="M" />
      <div style={{ fontSize: '11px', fontWeight: 'bold', textAlign: 'center', fontFamily: 'monospace' }}>{asset.asset_id}</div>
      <div style={{ fontSize: '10px', textAlign: 'center', color: '#333', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.name}</div>
      <div style={{ fontSize: '9px', textAlign: 'center', color: '#666' }}>{asset.branch?.name}</div>
    </div>
  );
}

export default function QRModal({ asset, onClose }) {
  const canvasRef = useRef(null);
  const logoUrl = window.location.origin + '/stpi-logo.png';

  const handleDownload = () => {
    const canvas = document.getElementById(`qr-canvas-${asset.asset_id}`);
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_${asset.asset_id}.png`;
    a.click();
  };

  const handlePrint = () => {
    const canvas = document.getElementById(`qr-canvas-${asset.asset_id}`);
    const qrDataUrl = canvas?.toDataURL('image/png') || '';
    const w = window.open('', '', 'width=400,height=500');
    w.document.write(`<html><head><title>QR Label - ${asset.asset_id}</title><style>
      body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
      .label { display: flex; flex-direction: column; align-items: center; padding: 16px; border: 2px solid #000; border-radius: 8px; gap: 8px; width: 200px; }
      .asset-id { font-size: 13px; font-weight: bold; font-family: monospace; }
      .asset-name { font-size: 11px; color: #333; text-align: center; }
      .branch { font-size: 10px; color: #666; }
      @media print { body { height: auto; } }
    </style></head><body>
      <div class="label">
        <img src="${logoUrl}" style="height:35px;object-fit:contain;" />
        <img src="${qrDataUrl}" style="width:130px;height:130px;" />
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
        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
          <QRLabel asset={asset} logoUrl={logoUrl} />
        </div>
        {/* Hidden canvas with just the QR for download */}
        <div style={{ display: 'none' }}>
          <QRCodeCanvas id={`qr-canvas-${asset.asset_id}`} value={asset.asset_id} size={256} level="M" />
        </div>
        <div className="form-actions" style={{ justifyContent: 'center' }}>
          <button type="button" onClick={onClose}>Close</button>
          <button onClick={handleDownload} style={{ background: 'linear-gradient(135deg, #38a169, #276749)' }} className="btn-primary">⬇ Download QR</button>
          <button onClick={handlePrint} className="btn-primary">🖨 Print Label</button>
        </div>
      </div>
    </div>
  );
}

// Bulk QR print for multiple assets
export function BulkQRPrint({ assets, onClose }) {
  const logoUrl = window.location.origin + '/stpi-logo.png';

  const handleBulkPrint = () => {
    const labels = assets.map(asset => {
      const canvas = document.getElementById(`qr-bulk-${asset.asset_id}`);
      const qrDataUrl = canvas?.toDataURL('image/png') || '';
      return `
        <div class="label">
          <img src="${logoUrl}" style="height:28px;object-fit:contain;" />
          <img src="${qrDataUrl}" style="width:110px;height:110px;" />
          <div class="asset-id">${asset.asset_id}</div>
          <div class="asset-name">${asset.name}</div>
          <div class="branch">${asset.branch?.name || ''}</div>
        </div>`;
    }).join('');

    const w = window.open('', '', 'width=900,height=700');
    w.document.write(`<html><head><title>Bulk QR Labels</title><style>
      body { font-family: Arial, sans-serif; margin: 16px; }
      .grid { display: flex; flex-wrap: wrap; gap: 12px; }
      .label { display: flex; flex-direction: column; align-items: center; padding: 12px; border: 1px solid #000; border-radius: 6px; gap: 4px; width: 160px; }
      .asset-id { font-size: 11px; font-weight: bold; font-family: monospace; }
      .asset-name { font-size: 9px; color: #333; text-align: center; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .branch { font-size: 8px; color: #666; }
      @media print { body { margin: 8px; } }
    </style></head><body><div class="grid">${labels}</div></body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  return (
    <div className="modal">
      <div className="modal-content" style={{ maxWidth: '700px' }}>
        <h2>Bulk QR Labels ({assets.length} assets)</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', maxHeight: '400px', overflowY: 'auto', padding: '16px', background: '#f7fafc', borderRadius: '8px', margin: '16px 0' }}>
          {assets.map(asset => (
            <div key={asset.id}>
              <QRLabel asset={asset} logoUrl={logoUrl} />
              <div style={{ display: 'none' }}>
                <QRCodeCanvas id={`qr-bulk-${asset.asset_id}`} value={asset.asset_id} size={256} level="M" />
              </div>
            </div>
          ))}
        </div>
        <div className="form-actions">
          <button type="button" onClick={onClose}>Close</button>
          <button onClick={handleBulkPrint} className="btn-primary">🖨 Print All Labels</button>
        </div>
      </div>
    </div>
  );
}
