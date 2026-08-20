import React, { useState } from 'react';
import { auth } from '../services/auth';
import { LogIn, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (username: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setError('Harap isi semua kolom!');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const user = await auth.login(trimmedUser, password);
        setSuccess(`Selamat datang kembali, ${user.username}!`);
        setTimeout(() => {
          onLoginSuccess(user.username);
        }, 1000);
      } else {
        await auth.register(trimmedUser, password);
        setSuccess('Registrasi berhasil! Silakan masuk.');
        setMode('login');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
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
        maxWidth: '420px',
        width: '100%',
        transform: 'rotate(-0.5deg)',
        backgroundColor: 'var(--bg-card)'
      }}>
        {/* Logo and Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo.png" alt="Kuroyomi Logo" style={{ height: '70px', marginBottom: '1rem' }} />
          <h2 style={{
            fontSize: '2rem',
            margin: 0,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '-1px'
          }}>
            {mode === 'login' ? 'Selamat ' : 'Gabung '}
            <span style={{
              background: 'var(--retro-purple)',
              color: '#fff',
              padding: '0 0.5rem',
              display: 'inline-block',
              transform: 'rotate(-2deg)'
            }}>
              {mode === 'login' ? 'Datang' : 'Kuroyomi'}
            </span>
          </h2>
          <p style={{ margin: '0.5rem 0 0 0', fontWeight: 600, color: 'var(--muted-text)' }}>
            {mode === 'login'
              ? 'Masuk ke perpustakaan komik pribadimu.'
              : 'Buat akun baru untuk mulai membaca.'}
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

        {/* Auth Form */}
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
              placeholder="Masukkan username..."
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
              ? 'Memproses...'
              : mode === 'login'
              ? 'MASUK (LOGIN)'
              : 'DAFTAR (REGISTER)'}
          </button>
        </form>

        {/* Footer Link */}
        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          borderTop: '2px dashed var(--border-color)',
          paddingTop: '1rem'
        }}>
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
              ? 'Belum punya akun? Daftar sekarang!'
              : 'Sudah punya akun? Masuk di sini!'}
          </button>
        </div>
      </div>
    </div>
  );
};
