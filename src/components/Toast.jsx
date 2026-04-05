import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '14px 24px',
            borderRadius: '10px',
            color: 'white',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            animation: 'slideUp 0.3s ease',
            background: t.type === 'success' ? 'linear-gradient(135deg, #38a169, #2f855a)' : t.type === 'error' ? 'linear-gradient(135deg, #e53e3e, #c53030)' : 'linear-gradient(135deg, #ed8936, #dd6b20)'
          }}>
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : '⚠'} {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
