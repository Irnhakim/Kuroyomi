import React, { useState } from 'react';
import { auth } from '../services/auth';
import { LogIn, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from '../services/i18n';

interface LoginPageProps {
  onLoginSuccess: (username: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [recoveryMode, setRecoveryMode] = useState<'none' | 'forgot-password' | 'forgot-username' | 'reset-password'>('none');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryIdentity, setRecoveryIdentity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setError(t('login.error.empty'));
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const user = await auth.login(trimmedUser, password);
        setSuccess(t('login.success.login', { username: user.username }));
        setTimeout(() => {
          onLoginSuccess(user.username);
        }, 1000);
      } else {
        await auth.register(trimmedUser, password, email || undefined);
        setSuccess(t('login.success.register'));
        setMode('login');
        setPassword('');
        setEmail('');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryIdentity.trim()) return;
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await auth.forgotPassword(recoveryIdentity);
      setSuccess(t('login.recovery.code_sent'));
      setRecoveryMode('reset-password');
    } catch (err: any) {
      setError(err.message || "Gagal memproses lupa password.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryIdentity.trim() || !resetToken.trim() || !newPassword) return;
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await auth.resetPassword(recoveryIdentity, resetToken, newPassword);
      setSuccess(t('login.recovery.reset_success'));
      setRecoveryMode('none');
      setMode('login');
      setUsername('');
      setPassword('');
      setResetToken('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || "Gagal mereset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await auth.forgotUsername(email);
      setSuccess(t('login.recovery.username_sent'));
      setRecoveryMode('none');
      setMode('login');
      setEmail('');
    } catch (err: any) {
      setError(err.message || "Gagal memproses pemulihan username.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '1rem'
    }}>
      <div className="comic-box" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '2rem',
        backgroundColor: 'var(--bg-card)',
        transform: 'rotate(-0.5deg)',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 900,
            margin: '0 0 0.5rem 0',
            textTransform: 'uppercase',
            letterSpacing: '-1px'
          }}>
            {recoveryMode === 'forgot-password' ? t('login.recovery.forgot_password_title')
              : recoveryMode === 'forgot-username' ? t('login.recovery.forgot_username_title')
              : recoveryMode === 'reset-password' ? t('login.recovery.reset_password_title')
              : mode === 'login' ? t('login.title.login')
              : t('login.title.register')}
          </h1>
          <p style={{
            color: 'var(--muted-text)',
            fontSize: '0.9rem',
            margin: 0,
            fontWeight: 600
          }}>
            {recoveryMode === 'forgot-password' ? t('login.recovery.forgot_password_desc')
              : recoveryMode === 'forgot-username' ? t('login.recovery.forgot_username_desc')
              : recoveryMode === 'reset-password' ? t('login.recovery.reset_password_desc')
              : mode === 'login' ? t('login.desc.login')
              : t('login.desc.register')}
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="comic-box" style={{
            backgroundColor: 'var(--retro-pink)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            marginBottom: '1.5rem',
            boxShadow: 'none',
            borderWidth: '2px'
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        {success && (
          <div className="comic-box" style={{
            backgroundColor: 'var(--retro-teal)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem',
            marginBottom: '1.5rem',
            boxShadow: 'none',
            borderWidth: '2px'
          }}>
            <CheckCircle size={20} style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{success}</span>
          </div>
        )}

        {/* Dynamic Forms based on Mode */}
        {recoveryMode === 'forgot-password' ? (
          <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                {t('login.label.identity')}
              </label>
              <input
                type="text"
                value={recoveryIdentity}
                onChange={(e) => setRecoveryIdentity(e.target.value)}
                placeholder="Username atau alamat email..."
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '3px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  outline: 'none',
                  boxShadow: '3px 3px 0px var(--border-color)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button type="submit" className="comic-btn comic-btn-yellow" disabled={loading} style={{ justifyContent: 'center', width: '100%' }}>
              {t('login.btn.send_code')}
            </button>
          </form>
        ) : recoveryMode === 'forgot-username' ? (
          <form onSubmit={handleForgotUsername} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                {t('login.label.registered_email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '3px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  outline: 'none',
                  boxShadow: '3px 3px 0px var(--border-color)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button type="submit" className="comic-btn comic-btn-yellow" disabled={loading} style={{ justifyContent: 'center', width: '100%' }}>
              {t('login.btn.recover_username')}
            </button>
          </form>
        ) : recoveryMode === 'reset-password' ? (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                {t('login.label.verification_code')}
              </label>
              <input
                type="text"
                maxLength={6}
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="123456"
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '3px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  outline: 'none',
                  boxShadow: '3px 3px 0px var(--border-color)',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  fontSize: '1.2rem',
                  letterSpacing: '4px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                {t('login.label.new_password')}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '3px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  outline: 'none',
                  boxShadow: '3px 3px 0px var(--border-color)',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button type="submit" className="comic-btn comic-btn-pink" disabled={loading} style={{ justifyContent: 'center', width: '100%' }}>
              {t('login.recovery.reset_password_title')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontWeight: 800,
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                fontSize: '0.85rem'
              }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username..."
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '3px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  outline: 'none',
                  boxShadow: '3px 3px 0px var(--border-color)',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontWeight: 800,
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                fontSize: '0.85rem'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '3px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  outline: 'none',
                  boxShadow: '3px 3px 0px var(--border-color)',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label style={{
                  display: 'block',
                  fontWeight: 800,
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  fontSize: '0.85rem'
                }}>
                  {t('login.label.email_optional')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '3px solid var(--border-color)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-color)',
                    color: 'var(--text-color)',
                    fontFamily: 'inherit',
                    fontWeight: 700,
                    outline: 'none',
                    boxShadow: '3px 3px 0px var(--border-color)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {mode === 'login' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '-0.25rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryMode('forgot-password');
                    setError(null);
                    setSuccess(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--retro-purple)',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  {t('login.recovery.forgot_password_title') + '?'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryMode('forgot-username');
                    setError(null);
                    setSuccess(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--retro-purple)',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  {t('login.recovery.forgot_username_title') + '?'}
                </button>
              </div>
            )}

            <button
              type="submit"
              className={`comic-btn ${mode === 'login' ? 'comic-btn-yellow' : 'comic-btn-pink'}`}
              disabled={loading}
              style={{
                justifyContent: 'center',
                width: '100%',
                marginTop: '0.5rem'
              }}
            >
              {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
              {loading
                ? t('login.btn.processing')
                : mode === 'login'
                ? t('login.btn.login')
                : t('login.btn.register')}
            </button>
          </form>
        )}

        {/* Footer Link */}
        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          borderTop: '2px dashed var(--border-color)',
          paddingTop: '1rem'
        }}>
          {recoveryMode !== 'none' ? (
            <button
              onClick={() => {
                setRecoveryMode('none');
                setError(null);
                setSuccess(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--retro-purple)',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {t('login.link.back_login')}
            </button>
          ) : (
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
                setSuccess(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--retro-purple)',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {mode === 'login'
                ? t('login.link.register')
                : t('login.link.login')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
