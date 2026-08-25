import React, { useState, useEffect } from 'react';
import { api, SERVER_ORIGIN } from '../services/api';
import { auth } from '../services/auth';
import { RefreshCw, Save, CheckCircle, Trash2, Plus, LogOut, Key, ShieldAlert } from 'lucide-react';
import { useTranslation } from '../services/i18n';
import type { Language } from '../services/i18n';
import { useModal } from '../services/modal';

interface SettingsPageProps {
  onLogout: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout }) => {
  const { t, setLanguage } = useTranslation();
  const { alert, confirm } = useModal();
  const [serverVersion, setServerVersion] = useState<string>('Unknown');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline'>('offline');

  // Settings states
  const [readerMode, setReaderMode] = useState<string>('webtoon');
  const [theme, setTheme] = useState<string>('dark');
  const [lang, setLang] = useState<string>('en');
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

  // Email states
  const [emailInput, setEmailInput] = useState('');
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  // Fullscreen Mode
  const [fullscreenMode, setFullscreenMode] = useState<'off' | 'reading' | 'always'>(() => {
    return (localStorage.getItem('fullscreen_mode') as any) || 'off';
  });

  // User management (admin only)
  const [allUsers, setAllUsers] = useState<Array<{ username: string; createdAt: string; lastOnline?: string; email?: string }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState('');
  const [editingPassword, setEditingPassword] = useState('');

  const handleAdminDeleteUser = async (targetUsername: string) => {
    if (targetUsername.toLowerCase() === 'admin') {
      await alert(t('settings.admin.delete_admin_error'));
      return;
    }
    if (!await confirm(t('settings.admin.delete_user_confirm', { username: targetUsername }))) {
      return;
    }
    setUsersLoading(true);
    try {
      await auth.adminDeleteUser(targetUsername);
      const updatedList = await auth.getAllUsers();
      setAllUsers(updatedList);
    } catch (e: any) {
      await alert(e.message || t('settings.admin.delete_user_error'));
    } finally {
      setUsersLoading(false);
    }
  };

  const loadSettingsAndStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_ORIGIN}/api/v1/meta`);
      if (res.ok) {
        const data = await res.json();
        setServerVersion(data.version || 'v0.6.x');
        setStatus('online');

        // Fetch all configs from server
        const configs = await api.getSettings();
        setReaderMode(configs.readerMode || 'webtoon');
        setTheme(configs.theme || 'dark');
        setLang(configs.lang || 'en');

        // Fetch extension repositories directly from GraphQL
        const repos = await api.getExtensionRepos();
        setRepoUrls(repos);
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
    setCurrentEmail(auth.getUserEmail());
    if (currentUser?.toLowerCase() === 'admin') {
      auth.getAllUsers().then(setAllUsers).catch(console.error);
    }
  }, []);

  const handleSaveGeneralSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateSettings({
        readerMode,
        theme,
        lang
      });

      // Instantly apply theme in DOM
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);

      // Instantly update translation context language
      setLanguage(lang as Language);

      // Save fullscreen mode and apply instantly
      localStorage.setItem('fullscreen_mode', fullscreenMode);
      if (fullscreenMode === 'always') {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          try {
            await document.documentElement.requestFullscreen();
          } catch (fsErr) {
            console.warn("Save trigger fullscreen failed:", fsErr);
          }
        }
      } else {
        if (document.exitFullscreen && document.fullscreenElement) {
          try {
            await document.exitFullscreen();
          } catch (fsErr) {
            console.warn("Save trigger exit fullscreen failed:", fsErr);
          }
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
      await alert(t('settings.general.save_error'));
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
      const repos = await api.getExtensionRepos();
      setRepoUrls(repos);
      setNewRepoUrl('');
    } catch (err: any) {
      console.error("Failed to add extension store", err);
      await alert(err.message || t('settings.repo.add_error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveRepo = async (url: string) => {
    if (!await confirm(t('settings.repo.remove_confirm'))) return;
    setActionLoading(true);
    try {
      await api.removeExtensionStore(url);
      const repos = await api.getExtensionRepos();
      setRepoUrls(repos);
    } catch (err: any) {
      console.error("Failed to remove extension store", err);
      await alert(err.message || t('settings.repo.remove_error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    if (await confirm(t('settings.account.logout_confirm'))) {
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
      setPassSuccess(t('settings.password.success'));
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

    if (!await confirm(t('settings.danger.alert_confirm'))) {
      return;
    }

    try {
      await api.deleteUserAccount(deleteConfirmPassword);
      await alert(t('settings.danger.success'));
      onLogout();
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal menghapus akun.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px' }}>
          App <span style={{ background: 'var(--retro-purple)', color: '#fff', padding: '0 0.5rem', display: 'inline-block', transform: 'rotate(-1.5deg)' }}>{t('settings.title')}</span>
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', fontWeight: 500, color: 'var(--muted-text)' }}>
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="settings-grid">
        {/* Configurations Forms Container */}
        <div className="settings-main-col">

          {/* Account Management Box */}
          <div className="comic-box" style={{ borderColor: 'var(--retro-purple)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', fontSize: '1.4rem' }}>
                {t('settings.account.title')} ({currentUser})
              </h2>
              <button className="comic-btn comic-btn-pink" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={handleLogout}>
                <LogOut size={16} /> {t('settings.account.logout')}
              </button>
            </div>

            {currentUser?.toLowerCase() === 'guest' ? (
              <div className="comic-box" style={{
                backgroundColor: 'var(--retro-purple)',
                color: '#fff',
                padding: '1.25rem',
                border: '3px solid var(--border-color)',
                boxShadow: '3px 3px 0px var(--border-color)',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {t('settings.account.guest_notice')}
                </p>
              </div>
            ) : (
              <>
                {/* Email configuration */}
                <div style={{ marginBottom: '1.5rem', borderBottom: '2px dashed var(--border-color)', paddingBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {t('settings.account.email_title')}
                  </h3>
              {currentEmail ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--retro-purple)' }}>{currentEmail}</span>
                  <button 
                    onClick={async () => {
                      if (await confirm(t('settings.account.email_change_confirm'))) {
                        setEmailInput(currentEmail);
                        setCurrentEmail(null);
                      }
                    }} 
                    className="comic-btn" 
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', boxShadow: 'none', transform: 'none' }}
                  >
                    {t('settings.account.email_btn_change')}
                  </button>
                </div>
              ) : (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!emailInput.trim()) return;
                  try {
                    await auth.updateEmail(emailInput);
                    setCurrentEmail(emailInput);
                    await alert(t('settings.account.email_success'));
                  } catch (err: any) {
                    await alert(err.message || "Gagal memperbarui email.");
                  }
                }} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', maxWidth: '400px' }}>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-color)',
                      color: 'var(--text-color)',
                      fontWeight: 700,
                      fontSize: '0.85rem'
                    }}
                  />
                  <button
                    type="submit"
                    className="comic-btn comic-btn-yellow"
                    style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', boxShadow: '2px 2px 0 var(--border-color)', transform: 'none' }}
                  >
                    {t('settings.account.email_btn_save')}
                  </button>
                </form>
              )}
            </div>

            {/* Change password form */}
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '2px dashed var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Key size={18} /> {t('settings.password.title')}
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
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>{t('settings.password.label.old')}</label>
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
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>{t('settings.password.label.new')}</label>
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
                  <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>{t('settings.password.label.confirm')}</label>
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
                {t('settings.password.btn.save')}
              </button>
            </form>

            {/* Danger Zone: Delete Account */}
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, fontSize: '1rem', color: 'var(--retro-pink)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={18} /> {t('settings.danger.title')}
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
                  {t('settings.danger.btn.delete')}
                </button>
              ) : (
                <form onSubmit={handleDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--retro-pink)' }}>
                    {t('settings.danger.warn')}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.25rem', fontSize: '0.8rem' }}>{t('settings.danger.confirm_placeholder')}</label>
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
                        {t('settings.danger.btn.confirm_delete')}
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
                        {t('settings.danger.btn.cancel')}
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
            </>
            )}
          </div>

          {/* General settings box */}
          <div className="comic-box">
            <h2 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, textTransform: 'uppercase', fontSize: '1.4rem' }}>
              {t('settings.general.title')}
            </h2>

            <form onSubmit={handleSaveGeneralSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Language */}
              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                  {t('settings.general.lang')}
                </label>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
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
                  <option value="en">English</option>
                  <option value="id">Indonesia</option>
                </select>
              </div>

              {/* Reading Mode */}
              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                  {t('settings.general.mode')}
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
                  <option value="paged-ltr">{t('settings.general.mode.paged')}</option>
                  <option value="webtoon">{t('settings.general.mode.webtoon')}</option>
                </select>
              </div>

              {/* Theme */}
              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                  {t('settings.general.theme')}
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
                  <option value="light">{t('settings.general.theme.light')}</option>
                  <option value="dark">{t('settings.general.theme.dark')}</option>
                </select>
              </div>

              {/* Fullscreen Mode */}
              <div>
                <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                  {t('settings.general.fullscreen')}
                  <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-text)', textTransform: 'none', marginTop: '0.1rem' }}>
                    {t('settings.general.fullscreen.desc')}
                  </span>
                </label>
                <select
                  value={fullscreenMode}
                  onChange={(e) => setFullscreenMode(e.target.value as any)}
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
                  <option value="off">{t('settings.general.fullscreen.off')}</option>
                  <option value="reading">{t('settings.general.fullscreen.reading')}</option>
                  <option value="always">{t('settings.general.fullscreen.always')}</option>
                </select>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="comic-btn comic-btn-pink" disabled={saving}>
                  <Save size={18} />
                  {saving ? 'Saving...' : t('settings.general.btn.save')}
                </button>

                {saveSuccess && (
                  <span className="comic-sticker sticker-teal" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', transform: 'none' }}>
                    <CheckCircle size={16} /> {t('settings.general.success')}
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Extension repositories settings box */}
          {currentUser?.toLowerCase() === 'admin' && (
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
          )}

        </div>

        {/* Server Status and Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Connection status box */}
          {currentUser?.toLowerCase() === 'admin' && (
            <div className="comic-box">
              <h2 style={{ margin: '0 0 1rem 0', fontWeight: 900, textTransform: 'uppercase', fontSize: '1.4rem' }}>
                {t('settings.server.title')}
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 0.4rem 0', fontWeight: 800, textTransform: 'uppercase' }}>
                    {t('settings.server.status')}: {status === 'online' ? 'ONLINE' : 'OFFLINE'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      id="status_server_url_input"
                      defaultValue={localStorage.getItem('suwayomi_server_url') || SERVER_ORIGIN}
                      placeholder="http://localhost:4567"
                      style={{
                        flex: 1,
                        minWidth: '150px',
                        padding: '0.35rem 0.5rem',
                        border: '2px solid var(--border-color)',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-color)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      onClick={async () => {
                        const input = document.getElementById('status_server_url_input') as HTMLInputElement;
                        if (input) {
                          const url = input.value.trim();
                          if (url) {
                            localStorage.setItem('suwayomi_server_url', url);
                            if (currentUser?.toLowerCase() === 'admin') {
                              try {
                                await api.updateServerConfig({ suwayomi_server_url: url });
                              } catch (e) {
                                console.warn("Failed to update global server URL config:", e);
                              }
                            }
                          } else {
                            localStorage.removeItem('suwayomi_server_url');
                            if (currentUser?.toLowerCase() === 'admin') {
                              try {
                                await api.updateServerConfig({});
                              } catch (e) {
                                console.warn("Failed to clear global server URL config:", e);
                              }
                            }
                          }
                          window.location.reload();
                        }
                      }}
                      className="comic-btn comic-btn-pink"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', boxShadow: 'none', transform: 'none' }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>

              <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: '0.5rem 0' }}>
                <strong>Server Version:</strong> {serverVersion}
              </p>
              <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: '0.5rem 0' }}>
                <strong>Server Port:</strong> 4567 (Default)
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <button className="comic-btn comic-btn-yellow" onClick={loadSettingsAndStatus} disabled={loading}>
                  <RefreshCw size={16} />
                  {t('settings.server.refresh')}
                </button>
              </div>
            </div>
          )}

          {/* About box */}
          {currentUser?.toLowerCase() === 'admin' && (
            <div className="comic-box">
              <h2 style={{ margin: '0 0 1rem 0', fontWeight: 900, textTransform: 'uppercase', fontSize: '1.4rem' }}>
                User Management ({allUsers.length})
              </h2>
              {usersLoading ? (
                <p style={{ fontStyle: 'italic', fontWeight: 600, color: 'var(--muted-text)', margin: 0 }}>
                  Loading users...
                </p>
              ) : allUsers.length === 0 ? (
                <p style={{ fontStyle: 'italic', fontWeight: 600, color: 'var(--muted-text)', margin: 0 }}>
                  No other users registered.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {allUsers.map((u, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '0.75rem 1rem',
                        border: '2px solid var(--border-color)',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-color)',
                        boxShadow: '2px 2px 0px var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ fontWeight: 850, fontSize: '1rem' }}>
                            {u.username}
                          </span>
                          {u.email ? (
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--retro-purple)' }}>
                              Email: {u.email}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted-text)', fontStyle: 'italic' }}>
                              {t('settings.admin.no_email')}
                            </span>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.05rem', marginTop: '0.15rem' }}>
                            {u.createdAt && (
                              <span style={{ fontSize: '0.75rem', fontWeight: 650, color: 'var(--muted-text)' }}>
                                Created: {new Date(u.createdAt).toLocaleDateString()}
                              </span>
                            )}
                            {u.lastOnline ? (
                              <span style={{ fontSize: '0.75rem', fontWeight: 650, color: 'var(--retro-teal)' }}>
                                Last Online: {new Date(u.lastOnline).toLocaleString()}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', fontWeight: 650, color: 'var(--muted-text)', fontStyle: 'italic' }}>
                                Last Online: Never
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="comic-btn"
                            onClick={() => {
                              setEditingUsername(u.username);
                              setEditingEmail(u.email || '');
                              setEditingPassword('');
                            }}
                            style={{
                              padding: '0.4rem 0.6rem',
                              backgroundColor: 'var(--retro-yellow)',
                              color: 'var(--text-color)',
                              border: '2px solid var(--border-color)',
                              transform: 'none',
                              boxShadow: 'none'
                            }}
                            title="Edit User Profile"
                          >
                            <Key size={16} />
                          </button>
                          {u.username.toLowerCase() !== 'admin' && (
                            <button
                              className="comic-btn"
                              onClick={() => handleAdminDeleteUser(u.username)}
                              style={{
                                padding: '0.4rem 0.6rem',
                                backgroundColor: 'var(--retro-pink)',
                                color: '#fff',
                                border: '2px solid var(--border-color)',
                                transform: 'none',
                                boxShadow: 'none'
                              }}
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {editingUsername === u.username && (
                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '2px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div>
                            <label style={{ display: 'block', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Email</label>
                            <input
                              type="email"
                              value={editingEmail}
                              onChange={(e) => setEditingEmail(e.target.value)}
                              placeholder="user@example.com"
                              style={{ width: '100%', padding: '0.4rem', border: '2px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontWeight: 700, fontSize: '0.85rem', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{t('settings.admin.new_password_placeholder')}</label>
                            <input
                              type="password"
                              value={editingPassword}
                              onChange={(e) => setEditingPassword(e.target.value)}
                              placeholder="••••••••"
                              style={{ width: '100%', padding: '0.4rem', border: '2px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', fontWeight: 700, fontSize: '0.85rem', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                            <button
                              onClick={() => setEditingUsername(null)}
                              className="comic-btn"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', boxShadow: 'none', transform: 'none' }}
                            >
                              {t('modal.cancel')}
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await auth.adminUpdateUser(u.username, editingEmail, editingPassword);
                                  await alert(t('settings.admin.save_success'));
                                  setEditingUsername(null);
                                  const list = await auth.getAllUsers();
                                  setAllUsers(list);
                                } catch (err: any) {
                                  await alert(err.message || t('settings.admin.save_error'));
                                }
                              }}
                              className="comic-btn comic-btn-yellow"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', boxShadow: '2px 2px 0 var(--border-color)', transform: 'none' }}
                            >
                              {t('modal.save')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* About box */}
          <div className="comic-box" style={{ transform: 'rotate(0.5deg)' }}>
            <h2 style={{ margin: '0 0 1rem 0', fontWeight: 900, textTransform: 'uppercase', fontSize: '1.4rem' }}>
              {t('settings.about.title')}
            </h2>
            <p style={{ margin: '0 0 1rem 0', lineHeight: 1.5, fontWeight: 500 }}>
              {t('settings.about.desc')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700 }}>{t('settings.about.bullet1')}</span>
              <span style={{ fontWeight: 700 }}>{t('settings.about.bullet2')}</span>
              <span style={{ fontWeight: 700 }}>{t('settings.about.bullet3')}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.25rem', borderTop: '2px dashed var(--border-color)', paddingTop: '0.75rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase' }}>Credits:</span>
              <a href="https://github.com/Irnhakim" target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: 'var(--retro-purple)', textDecoration: 'underline' }}>GitHub @Irnhakim</a>

              <span style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', marginTop: '0.5rem' }}>Support Development:</span>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                <a href="https://saweria.co/irnhakim" target="_blank" rel="noreferrer" className="comic-btn comic-btn-yellow" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', boxShadow: '2px 2px 0 var(--border-color)', textDecoration: 'none', transform: 'none' }}>Saweria</a>
                <a href="https://trakteer.id/ryuzure" target="_blank" rel="noreferrer" className="comic-btn comic-btn-pink" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', boxShadow: '2px 2px 0 var(--border-color)', textDecoration: 'none', transform: 'none' }}>Trakteer</a>
              </div>

              <span style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', marginTop: '0.5rem' }}>Contact Support:</span>
              <a href="mailto:support@irnhakim.my.id" style={{ fontWeight: 700, color: 'var(--retro-purple)', textDecoration: 'underline' }}>support@irnhakim.my.id</a>
              <a href="https://t.me/Pepeji015" style={{ fontWeight: 700, color: 'var(--retro-purple)', textDecoration: 'underline' }}>Telegram: @Pepeji015</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
