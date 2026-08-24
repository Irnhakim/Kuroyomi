import React, { createContext, useContext, useState, useRef } from 'react';
import { useTranslation } from './i18n';

interface ModalContextType {
  alert: (message: string) => Promise<void>;
  confirm: (message: string) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'alert' | 'confirm'>('alert');
  const [message, setMessage] = useState('');
  const resolveRef = useRef<((value: any) => void) | null>(null);

  const showAlert = (msg: string): Promise<void> => {
    setMessage(msg);
    setType('alert');
    setIsOpen(true);
    return new Promise<void>((resolve) => {
      resolveRef.current = resolve;
    });
  };

  const showConfirm = (msg: string): Promise<boolean> => {
    setMessage(msg);
    setType('confirm');
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  };

  const handleClose = (result: boolean) => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  };

  return (
    <ModalContext.Provider value={{ alert: showAlert, confirm: showConfirm }}>
      {children}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div className="comic-box" style={{
            maxWidth: '420px',
            width: '100%',
            backgroundColor: 'var(--bg-card)',
            padding: '1.75rem',
            transform: 'rotate(-0.5deg)',
            boxShadow: '6px 6px 0px var(--border-color)',
            animation: 'modalPop 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <p style={{
              fontWeight: 800,
              fontSize: '1.05rem',
              lineHeight: 1.5,
              margin: '0 0 1.75rem 0',
              color: 'var(--text-color)',
              whiteSpace: 'pre-wrap',
              textAlign: 'center'
            }}>
              {message}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              {type === 'confirm' && (
                <button
                  onClick={() => handleClose(false)}
                  className="comic-btn comic-btn-white"
                  style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', transform: 'none', boxShadow: '2px 2px 0 var(--border-color)' }}
                >
                  {t('modal.cancel')}
                </button>
              )}
              <button
                onClick={() => handleClose(true)}
                className="comic-btn comic-btn-yellow"
                style={{ padding: '0.4rem 1.5rem', fontSize: '0.85rem', transform: 'none', boxShadow: '2px 2px 0 var(--border-color)' }}
                autoFocus
              >
                {t('modal.ok')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
