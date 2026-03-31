import { useState, useEffect } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

let toastIdCounter = 0;
let externalAddToast: ((msg: string, type: 'success' | 'error') => void) | null = null;

export function addToast(message: string, type: 'success' | 'error' = 'error') {
  externalAddToast?.(message, type);
}

export function ToastNotifications() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    externalAddToast = (message, type) => {
      const id = ++toastIdCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    return () => {
      externalAddToast = null;
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            background: toast.type === 'success' ? '#059669' : '#dc2626',
            color: 'white',
            padding: '10px 20px',
            borderRadius: 8,
            fontSize: 13,
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 500,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            maxWidth: 400,
            textAlign: 'center',
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
