import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { auth } from '../services/auth';
import { RefreshCw, Save, CheckCircle, Trash2, Plus, LogOut, Key, ShieldAlert } from 'lucide-react';

interface SettingsPageProps {
  onLogout: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout }) => {
  const [serverVersion, setServerVersion] = useState<string>('Unknown');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline'>('offline');

  // Settings states
  const [readerMode, setReaderMode] = useState<string>('paged-ltr');
  const [theme, setTheme] = useState<string>('light');
  const [repoUrls, setRepoUrls] = useState<string[]>([]);
  const [newRepoUrl, setNewRepoUrl] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Account Management states
  const currentUser = auth.getCurrentUser();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Account Delete states
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadSettingsAndStatus = async () => {
    setLoading(true);
    try {
      // Check server health
      const isDev = window.location.port === '5173' || window.location.port === '5174';
      const serverOrigin = isDev ? 'http://localhost:4567' : window.location.origin;
      const res = await fetch(`${serverOrigin}/api/v1/meta`);
      if (res.ok) {
        const data = await res.json();
        setServerVersion(data.version || 'v0.6.x');
        setStatus('online');

        // Fetch all configs from server
        const configs = await api.getSettings();
        setReaderMode(configs.readerMode || 'paged-ltr');
        setTheme(configs.theme || 'light');
        setRepoUrls(configs.extensionRepoUrls || []);
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

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateSettings({
        readerMode,
        theme
      });

      // Instantly apply theme in DOM
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
      alert("Failed to save settings to browser.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoUrl.trim()) return;
    setActionLoading(true);
    try {
      await api.addExtensionStore(newRepoUrl.trim());
      setRepoUrls(prev => [...prev, newRepoUrl.trim()]);
      setNewRepoUrl('');
    } catch (err) {
      console.error("Failed to add extension store", err);
      alert("Failed to add repository. Make sure the URL is a valid index.json or index.pb path.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveRepo = async (url: string) => {
    if (!confirm("Are you sure you want to remove this extension repository?")) return;
    setActionLoading(true);
    try {
      await api.removeExtensionStore(url);
      setRepoUrls(prev => prev.filter(item => item !== url));
    } catch (err) {
      console.error("Failed to remove extension store", err);
      alert("Failed to remove repository.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar?")) {
      auth.logout();
      onLogout();
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword !== confirmPassword) {
      setPassError('Password baru dan konfirmasi password tidak cocok!');
      return;
    }

    try {
      await auth.changePassword(oldPassword, newPassword);
      setPassSuccess('Password berhasil diubah!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(err.message || 'Terjadi kesalahan saat mengubah password.');
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (!confirm("Tindakan ini permanen. Semua data library dan riwayat Anda akan terhapus. Lanjutkan hapus akun?")) {
      return;
    }

    try {
      await api.deleteUserAccount(deleteConfirmPassword);
      alert('Akun Anda berhasil dihapus.');
      onLogout();
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal menghapus akun.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px' }}>
          App <span style={{ background: 'var(--retro-purple)', color: '#fff', padding: '0 0.5rem', display: 'inline-block', transform: 'rotate(-1.5deg)' }}>Settings</span>
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', fontWeight: 500, color: 'var(--muted-text)' }}>
          Manage your server connection, user account, reader defaults, and source repositories.
        </p>
      </div>

      <div className="settings-grid">
        {/* Configurations Forms Container */}
        <div className="settings-main-col">

          {/* Account Management Box */}
          <div className="comic-box" style={{ borderColor: 'var(--retro-purple)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', fontSize: '1.4rem' }}>
                Kelola Akun ({currentUser})
              </h2>
              <button className="comic-btn comic-btn-pink" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={handleLogout}>
                <LogOut size={16} /> Log Out
              </button>
            </div>

            {/* Change password form */}
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '2px dashed var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={18} /> Ubah Password
              </h3>

              {passError && (
                <div className="comic-sticker sticker-pink" style={{ transform: 'none', margin: '0.5rem 0', display: 'block' }}>
                  {passError}
                </div>
              )}

              {passSuccess && (
                <div className="comic-sticker sticker-teal" style={{ transform: 'none', margin: '0.5rem 0', display: 'block' }}>
                  {passSuccess}
                </div>
              )}

              <div className="settings-password-grid" style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Password Lama</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Password Baru</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                      fontWeight: 700,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <button type="submit" className="comic-btn comic-btn-purple" style={{ alignSelf: 'flex-start', marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                Simpan Password Baru
              </button>
            </form>

            {/* Danger Zone: Delete Account */}
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, fontSize: '1rem', color: 'var(--retro-pink)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={18} /> Zona Bahaya (Danger Zone)
              </h3>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  className="comic-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--retro-pink)',
                    borderColor: 'var(--retro-pink)',
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    boxShadow: 'none'
                  }}
                >
                  Hapus Akun Ini
                </button>
              ) : (
                <form onSubmit={handleDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--retro-pink)' }}>
                    PERINGATAN: Menghapus akun akan membuang semua library, riwayat, dan data lokal secara permanen!
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.25rem', fontSize: '0.8rem' }}>Masukkan Password untuk Konfirmasi</label>
                      <input
                        type="password"
                        value={deleteConfirmPassword}
                        onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '2px solid var(--retro-pink)',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-color)',
                          color: 'var(--text-color)',
                          fontWeight: 700,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" className="comic-btn comic-btn-pink" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                        Konfirmasi Hapus Akun
                      </button>
                      <button
                        type="button"
                        className="comic-btn comic-btn-white"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmPassword('');
                          setDeleteError(null);
                        }}
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                  {deleteError && (
                    <div className="comic-sticker sticker-pink" style={{ transform: 'none', display: 'inline-block', marginTop: '0.5rem' }}>
                      {deleteError}
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>

          {/* General settings box */}
          <div className="comic-box">
            <h2 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, textTransform: 'uppercase', fontSize: '1.4rem' }}>
              Reading & General Settings
            </h2>

            <form onSubmit={handleSaveGeneralSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                  <option value="light">Light Mode (Tokyo Night Day)</option>
                  <option value="dark">Dark Mode (Tokyo Night Classic)</option>
                </select>
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

          {/* Extension repositories settings box */}
          <div className="comic-box">
            <h2 style={{ margin: '0 0 1rem 0', fontWeight: 900, textTransform: 'uppercase', fontSize: '1.4rem' }}>
              Extension Repositories ({repoUrls.length})
            </h2>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem', color: 'var(--muted-text)', fontWeight: 600 }}>
              Add one or more extension stores to download more sources (e.g. Keiyoushi).
            </p>

            {/* Repos list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {repoUrls.length === 0 ? (
                <p style={{ fontStyle: 'italic', fontWeight: 600, color: 'var(--muted-text)', margin: 0 }}>
                  No custom repositories added. Standard/bundled sources only.
                </p>
              ) : (
                repoUrls.map((url, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-color)',
                      boxShadow: '2px 2px 0px var(--border-color)'
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', wordBreak: 'break-all', paddingRight: '1rem' }}>
                      {url}
                    </span>
                    <button
                      className="comic-btn"
                      onClick={() => handleRemoveRepo(url)}
                      disabled={actionLoading}
                      style={{
                        padding: '0.4rem 0.6rem',
                        backgroundColor: 'var(--retro-pink)',
                        color: '#fff',
                        border: '2px solid var(--border-color)',
                        transform: 'none',
                        boxShadow: 'none'
                      }}
                      title="Remove Repository"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add new repo form */}
            <form onSubmit={handleAddRepo} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={newRepoUrl}
                onChange={(e) => setNewRepoUrl(e.target.value)}
                placeholder="Enter repository index URL (e.g., https://...)"
                disabled={actionLoading}
                style={{
                  flex: 1,
                  minWidth: '240px',
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
              <button
                type="submit"
                className="comic-btn comic-btn-yellow"
                disabled={actionLoading || !newRepoUrl.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Plus size={18} />
                Add Repository
              </button>
            </form>
            <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.75rem', color: 'var(--muted-text)', fontWeight: 700, wordBreak: 'break-all' }}>
              Keiyoushi Repo: https://raw.githubusercontent.com/keiyoushi/extensions/repo/index.min.json
            </p>
          </div>

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
                  http://localhost:4567
                </p>
              </div>
            </div>

            <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: '0.5rem 0' }}>
              <strong>Server Version:</strong> {serverVersion}
            </p>
            <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: '0.5rem 0' }}>
              <strong>Server Port:</strong> 4567 (Default)
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
