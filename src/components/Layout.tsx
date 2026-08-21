import React from 'react';
import { BookOpen, Compass, Settings, Sun, Moon } from 'lucide-react';

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
              Library
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
              Browse
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
              Settings
            </button>
          </nav>

          {/* Theme Toggle Button */}
          <button
            className="comic-btn comic-btn-yellow theme-toggle"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
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
          <span>Library</span>
        </button>
        <button 
          className={`bottom-nav-btn ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          <Compass size={20} />
          <span>Browse</span>
        </button>
        <button 
          className={`bottom-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={20} />
          <span>Settings</span>
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
          KUROYOMI © 2026 • Powered by Suwayomi Server
        </p>
      </footer>
    </div>
  );
};
