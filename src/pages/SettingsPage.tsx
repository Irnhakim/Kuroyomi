import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RefreshCw, Save, CheckCircle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [serverVersion, setServerVersion] = useState<string>('Unknown');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline'>('offline');
  
  // Settings states
  const [readerMode, setReaderMode] = useState<string>('paged-ltr');
  const [theme, setTheme] = useState<string>('light');
  const [repoUrl, setRepoUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadSettingsAndStatus = async () => {
    setLoading(true);
    try {
      // Check server health
      const res = await fetch('http://localhost:3001/api/health');
      if (res.ok) {
        const data = await res.json();
        setServerVersion(data.version || 'v1.0.0');
        setStatus('online');
        
        // Fetch all configs from server
        const configs = await api.getSettings();
        setReaderMode(configs.readerMode || 'paged-ltr');
        setTheme(configs.theme || 'light');
        setRepoUrl(configs.extensionRepoUrl || '');
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
    loadSettingsAndStatus();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateSettings({
        readerMode,
        theme,
        extensionRepoUrl: repoUrl
      });
      
      // Instantly apply theme in DOM
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
      alert("Failed to save settings to backend.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px' }}>
          App <span style={{ background: 'var(--retro-purple)', color: '#fff', padding: '0 0.5rem', display: 'inline-block', transform: 'rotate(-1.5deg)' }}>Settings</span>
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', fontWeight: 500, color: 'var(--muted-text)' }}>
          Manage your server connection, reader defaults, and source repositories.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Configurations Form */}
        <div className="comic-box" style={{ gridColumn: 'span 2' }}>
          <h2 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, textTransform: 'uppercase', fontSize: '1.4rem' }}>
            Reading & General Settings
          </h2>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Reading Mode */}
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                Mode Baca Default
              </label>
              <select
                value={readerMode}
                onChange={(e) => setReaderMode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '3px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-color)',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  outline: 'none',
                  boxShadow: '3px 3px 0px var(--border-color)'
                }}
              >
                <option value="paged-ltr">Single Page (Halaman demi Halaman)</option>
                <option value="webtoon">Webtoon (Scroll Vertikal)</option>
              </select>
            </div>

            {/* Theme */}
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                Tema Aplikasi (Theme)
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '3px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-color)',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  outline: 'none',
                  boxShadow: '3px 3px 0px var(--border-color)'
                }}
              >
                <option value="light">Light Mode (Kertas Komik Buram)</option>
                <option value="dark">Dark Mode (Warm Charcoal Paper)</option>
              </select>
            </div>

            {/* Extension Repository URL */}
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                Repositori Ekstensi URL
              </label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://raw.githubusercontent.com/..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '3px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-color)',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  outline: 'none',
                  boxShadow: '3px 3px 0px var(--border-color)',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--muted-text)', fontWeight: 700 }}>
                Default: https://raw.githubusercontent.com/keiyoushi/extensions/main/index.min.json
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="comic-btn comic-btn-pink" disabled={saving}>
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Configurations'}
              </button>
              
              {saveSuccess && (
                <span className="comic-sticker sticker-teal" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', transform: 'none' }}>
                  <CheckCircle size={16} /> Saved Successfully!
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Server Status and Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Connection status box */}
          <div className="comic-box">
            <h2 style={{ margin: '0 0 1rem 0', fontWeight: 900, textTransform: 'uppercase', fontSize: '1.4rem' }}>
              Kuroyomi Server
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
                  http://localhost:3001
                </p>
              </div>
            </div>

            <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: '0.5rem 0' }}>
              <strong>Server Version:</strong> {serverVersion}
            </p>
            <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: '0.5rem 0' }}>
              <strong>Server Port:</strong> 3001 (Default)
            </p>

            <button className="comic-btn comic-btn-yellow" style={{ marginTop: '1rem' }} onClick={loadSettingsAndStatus} disabled={loading}>
              <RefreshCw size={16} />
              Refresh Status
            </button>
          </div>

          {/* About box */}
          <div className="comic-box" style={{ transform: 'rotate(0.5deg)' }}>
            <h2 style={{ margin: '0 0 1rem 0', fontWeight: 900, textTransform: 'uppercase', fontSize: '1.4rem' }}>
              About Kuroyomi
            </h2>
            <p style={{ margin: '0 0 1rem 0', lineHeight: 1.5, fontWeight: 500 }}>
              Kuroyomi is a native web client for manga readers, executing sources directly inside a local Node.js environment without heavy containers.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700 }}>• 100% Free and Open Source</span>
              <span style={{ fontWeight: 700 }}>• Local native execution</span>
              <span style={{ fontWeight: 700 }}>• Webtoon and Single-Page Reader</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
