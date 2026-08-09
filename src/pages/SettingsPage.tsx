import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [serverVersion, setServerVersion] = useState<string>('Unknown');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline'>('offline');

  const checkServerStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4567/api/v1/meta');
      if (res.ok) {
        const data = await res.json();
        setServerVersion(data.version || 'v0.6.x');
        setStatus('online');
      } else {
        setStatus('offline');
      }
    } catch (e) {
      setStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkServerStatus();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px' }}>
          App <span style={{ background: 'var(--retro-purple)', color: '#fff', padding: '0 0.5rem', display: 'inline-block', transform: 'rotate(-1.5deg)' }}>Settings</span>
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', fontWeight: 500, color: 'var(--muted-text)' }}>
          Manage your server connection and check client status.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Connection status box */}
        <div className="comic-box">
          <h2 style={{ margin: '0 0 1rem 0', fontWeight: 900, textTransform: 'uppercase', fontSize: '1.4rem' }}>
            Suwayomi Server
          </h2>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            border: '2px dashed var(--border-color)',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-color)',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: status === 'online' ? 'var(--retro-teal)' : 'var(--retro-pink)',
              border: '2px solid var(--border-color)',
              boxShadow: '1px 1px 0px var(--border-color)'
            }} />
            <div>
              <p style={{ margin: 0, fontWeight: 800, textTransform: 'uppercase' }}>
                Status: {status === 'online' ? 'ONLINE' : 'OFFLINE'}
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted-text)', fontWeight: 700 }}>
                http://localhost:4567
              </p>
            </div>
          </div>

          <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>
            <strong>Server Version:</strong> {serverVersion}
          </p>
          <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>
            <strong>Server Port:</strong> 4567 (Default)
          </p>

          <button className="comic-btn comic-btn-yellow" style={{ marginTop: '1rem' }} onClick={checkServerStatus} disabled={loading}>
            <RefreshCw size={16} />
            Test Connection
          </button>
        </div>

        {/* Info box */}
        <div className="comic-box" style={{ transform: 'rotate(0.5deg)' }}>
          <h2 style={{ margin: '0 0 1rem 0', fontWeight: 900, textTransform: 'uppercase', fontSize: '1.4rem' }}>
            About Kuroyomi
          </h2>
          <p style={{ margin: '0 0 1rem 0', lineHeight: 1.5, fontWeight: 500 }}>
            Kuroyomi is a web client for Suwayomi-Server. It brings all of Tachiyomi's and Mihon's powerful extensions to your web browser with a vibrant Neo-brutalist and retro style.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700 }}>• 100% Free and Open Source</span>
            <span style={{ fontWeight: 700 }}>• Local native execution (No docker required)</span>
            <span style={{ fontWeight: 700 }}>• Webtoon and Single-Page Reader modes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
