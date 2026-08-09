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
      <header style={{
        borderBottom: '3px solid var(--border-color)',
        backgroundColor: 'var(--bg-card)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 4px 0px rgba(0,0,0,0.05)'
      }}>
        {/* Logo and Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => setActiveTab('library')}>
          <img src="/logo.png" alt="Kuroyomi" style={{ height: '42px' }} />
          <div className="comic-sticker sticker-pink" style={{ fontSize: '0.65rem' }}>
            NATIVE BETA
          </div>
        </div>

        {/* Desktop Navigation & Actions */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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
            className="comic-btn comic-btn-yellow"
            onClick={toggleTheme}
            style={{ 
              padding: '0.5rem', 
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              justifyContent: 'center'
            }}
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
      <footer style={{
        borderTop: '3px solid var(--border-color)',
        backgroundColor: 'var(--bg-card)',
        padding: '1.5rem',
        textAlign: 'center',
        marginTop: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexDirection: 'column' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>
            KUROYOMI • Powered by Suwayomi Server
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="comic-sticker sticker-teal">Neo-Brutalist</span>
            <span className="comic-sticker sticker-yellow">Playful Retro</span>
            <span className="comic-sticker sticker-purple">Offline First</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
