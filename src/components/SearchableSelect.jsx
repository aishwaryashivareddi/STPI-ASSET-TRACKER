import { useState, useRef, useEffect } from 'react';

export default function SearchableSelect({ options, value, onChange, placeholder = 'Select...', required = false, extraOption }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef();

  const selectedLabel = options.find(o => String(o.value) === String(value))?.label || '';

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', background: '#f7fafc', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span style={{ color: value ? '#2d3748' : '#a0aec0' }}>{selectedLabel || placeholder}</span>
        <span style={{ fontSize: '10px', color: '#718096' }}>▼</span>
      </div>
      {required && <input type="text" value={value} onChange={() => {}} required style={{ position: 'absolute', opacity: 0, height: 0, width: 0 }} tabIndex={-1} />}
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, background: 'white', border: '2px solid #e2e8f0', borderRadius: '8px', marginTop: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '250px', display: 'flex', flexDirection: 'column' }}>
          <input
            autoFocus
            type="text"
            placeholder="Type to search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '10px 14px', border: 'none', borderBottom: '2px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
          />
          <div style={{ overflowY: 'auto', maxHeight: '200px' }}>
            <div onClick={() => { onChange(''); setOpen(false); setSearch(''); }} style={{ padding: '10px 14px', cursor: 'pointer', color: '#a0aec0', fontSize: '14px', borderBottom: '1px solid #f1f5f9' }}>
              {placeholder}
            </div>
            {filtered.map(o => (
              <div
                key={o.value}
                onClick={() => { onChange(String(o.value)); setOpen(false); setSearch(''); }}
                style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '14px', background: String(o.value) === String(value) ? '#ebf4ff' : 'white', borderBottom: '1px solid #f1f5f9' }}
                onMouseEnter={(e) => e.target.style.background = '#f7fafc'}
                onMouseLeave={(e) => e.target.style.background = String(o.value) === String(value) ? '#ebf4ff' : 'white'}
              >
                {o.label}
              </div>
            ))}
            {filtered.length === 0 && <div style={{ padding: '14px', color: '#a0aec0', textAlign: 'center', fontSize: '14px' }}>No results</div>}
            {extraOption && (
              <div
                onClick={() => { extraOption.onClick(); setOpen(false); setSearch(''); }}
                style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: '#38a169', borderTop: '2px solid #e2e8f0' }}
              >
                {extraOption.label}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
