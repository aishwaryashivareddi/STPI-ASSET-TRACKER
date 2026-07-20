import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { assets } from './api';

export default function QRScanner() {
  const [status, setStatus] = useState('idle'); // idle | scanning | found | error
  const [message, setMessage] = useState('');
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        await scanner.stop();
        setStatus('found');
        setMessage(`Found: ${decodedText} — looking up asset...`);
        try {
          const res = await assets.getAll({ search: decodedText, limit: 1 });
          const found = res.data.data.assets?.[0];
          if (found && found.asset_id === decodedText) {
            setMessage(`Asset found: ${found.name}`);
            setTimeout(() => navigate(`/assets?search=${decodedText}`), 800);
          } else {
            setStatus('error');
            setMessage(`No asset found with ID: ${decodedText}`);
          }
        } catch (e) {
          setStatus('error');
          setMessage('Failed to look up asset.');
        }
      },
      () => {}
    ).then(() => setStatus('scanning'))
      .catch(() => {
        setStatus('error');
        setMessage('Could not access camera. Please allow camera permissions.');
      });

    return () => { scanner.stop().catch(() => {}); };
  }, [navigate]);

  const restart = () => {
    setStatus('idle');
    setMessage('');
    window.location.reload();
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>📷 QR Scanner</h1>
        <div>
          <button onClick={() => navigate('/assets')}>← Back to Assets</button>
        </div>
      </header>

      <div style={{ maxWidth: '500px', margin: '40px auto', textAlign: 'center' }}>
        <p style={{ color: '#718096', marginBottom: '24px' }}>
          Point your camera at an asset QR code to look it up instantly.
        </p>

        <div id="qr-reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e2e8f0' }} />

        {status === 'scanning' && (
          <p style={{ marginTop: '16px', color: '#667eea', fontWeight: 600 }}>🔍 Scanning...</p>
        )}
        {status === 'found' && (
          <p style={{ marginTop: '16px', color: '#38a169', fontWeight: 600 }}>✅ {message}</p>
        )}
        {status === 'error' && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ color: '#e53e3e', fontWeight: 600 }}>❌ {message}</p>
            <button onClick={restart} className="btn-primary" style={{ marginTop: '12px' }}>Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
}
