import React from 'react';
import { BookOpen, Compass, Clock, Settings, Sun, Moon, RefreshCw } from 'lucide-react';
import { useTranslation } from '../services/i18n';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
}) => {
  const { t } = useTranslation();

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        {/* Logo and Brand */}
        <div className="header-brand" onClick={() => setActiveTab('library')}>
          <img src="/logo.png" alt="Kuroyomi" className="header-logo" />
          <span className="header-title">Kuroyomi</span>
        </div>

        {/* Desktop Navigation & Actions */}
        <div className="header-actions">
          <nav className="desktop-nav">
            <button
              className={`nav-tab ${activeTab === 'library' ? 'active' : ''}`}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onClick={() => setActiveTab('library')}
            >
              <BookOpen size={20} />
              {t('nav.library')}
            </button>

            <button
              className={`nav-tab ${activeTab === 'updates' ? 'active' : ''}`}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onClick={() => setActiveTab('updates')}
            >
              <RefreshCw size={20} />
              {t('nav.updates')}
            </button>

            <button
              className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onClick={() => setActiveTab('history')}
            >
              <Clock size={20} />
              {t('nav.history')}
            </button>

            <button
              className={`nav-tab ${activeTab === 'browse' ? 'active' : ''}`}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onClick={() => setActiveTab('browse')}
            >
              <Compass size={20} />
              {t('nav.browse')}
            </button>

            <button
              className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={20} />
              {t('nav.settings')}
            </button>
          </nav>

          {/* Theme Toggle Button */}
          <button
            className="comic-btn comic-btn-yellow theme-toggle"
            onClick={toggleTheme}
            title={theme === 'light' ? t('theme.toggle.dark') : t('theme.toggle.light')}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        <button
          className={`bottom-nav-btn ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <BookOpen size={20} />
          <span>{t('nav.library')}</span>
        </button>
        <button
          className={`bottom-nav-btn ${activeTab === 'updates' ? 'active' : ''}`}
          onClick={() => setActiveTab('updates')}
        >
          <RefreshCw size={20} />
          <span>{t('nav.updates')}</span>
        </button>
        <button
          className={`bottom-nav-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Clock size={20} />
          <span>{t('nav.history')}</span>
        </button>
        <button
          className={`bottom-nav-btn ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          <Compass size={20} />
          <span>{t('nav.browse')}</span>
        </button>
        <button
          className={`bottom-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={20} />
          <span>{t('nav.settings')}</span>
        </button>
      </nav>

      {/* Retro Comic Footer */}
      <footer className="app-footer" style={{
        borderTop: '3px solid var(--border-color)',
        backgroundColor: 'var(--bg-card)',
        padding: '1.25rem',
        textAlign: 'center',
        marginTop: 'auto'
      }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-color)' }}>
          {t('footer.text')}
        </p>
      </footer>
    </div>
  );
};
