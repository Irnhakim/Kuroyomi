import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { LibraryPage } from './pages/LibraryPage';
import { BrowsePage } from './pages/BrowsePage';
import { MangaDetailPage } from './pages/MangaDetailPage';
import { ReaderPage } from './pages/ReaderPage';
import { SettingsPage } from './pages/SettingsPage';
import { HistoryPage } from './pages/HistoryPage';
import { LoginPage } from './pages/LoginPage';
import { UpdatesPage } from './pages/UpdatesPage';
import { auth } from './services/auth';
import { api, SERVER_ORIGIN } from './services/api';

type ActivePage = 'library' | 'browse' | 'settings' | 'manga-detail' | 'reader' | 'history' | 'updates';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activePage, setActivePage] = useState<ActivePage>(() => {
    const saved = sessionStorage.getItem('kuroyomi_active_page');
    return (saved as ActivePage) || 'library';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Detail selection
  const [selectedMangaId, setSelectedMangaId] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('kuroyomi_selected_manga_id');
    return saved ? parseInt(saved, 10) : null;
  });
  const [detailBackPage, setDetailBackPage] = useState<ActivePage>(() => {
    const saved = sessionStorage.getItem('kuroyomi_detail_back_page');
    return (saved as ActivePage) || 'library';
  });

  // Reader selection
  const [readerMangaId, setReaderMangaId] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('kuroyomi_reader_manga_id');
    return saved ? parseInt(saved, 10) : null;
  });
  const [readerChapterId, setReaderChapterId] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('kuroyomi_reader_chapter_id');
    return saved ? parseInt(saved, 10) : null;
  });

  // Connection Setup States
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [inputServerUrl, setInputServerUrl] = useState(SERVER_ORIGIN);

  // Check backend connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch(`${SERVER_ORIGIN}/api/v1/meta`, { method: 'GET' });
        if (res.ok) {
          setBackendOnline(true);
        } else {
          setBackendOnline(false);
        }
      } catch (err) {
        setBackendOnline(false);
      }
    };
    checkConnection();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingConnection(true);
    setConnectionError(null);
    let targetUrl = inputServerUrl.trim();
    if (!targetUrl) {
      setConnectionError("Server URL cannot be empty!");
      setTestingConnection(false);
      return;
    }
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `http://${targetUrl}`;
    }
    if (targetUrl.endsWith('/')) {
      targetUrl = targetUrl.slice(0, -1);
    }

    try {
      const res = await fetch(`${targetUrl}/api/v1/meta`);
      if (res.ok) {
        localStorage.setItem('suwayomi_server_url', targetUrl);
        setBackendOnline(true);
        window.location.reload();
      } else {
        setConnectionError(`Server returned status code ${res.status}`);
      }
    } catch (err) {
      setConnectionError("Failed to connect. Please make sure the URL is correct and Suwayomi-Server is running.");
    } finally {
      setTestingConnection(false);
    }
  };

  // Check login session on mount
  useEffect(() => {
    const logged = auth.isLoggedIn();
    setIsLoggedIn(logged);
    if (logged) {
      applyUserTheme();
    } else {
      applyDefaultTheme();
    }
  }, [isLoggedIn]);

  // Auto-fullscreen on first user interaction if enabled (Always mode)
  useEffect(() => {
    const handleGesture = async () => {
      const mode = localStorage.getItem('fullscreen_mode');
      if (mode === 'always' && !document.fullscreenElement) {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch (e) {
          console.warn("Auto-fullscreen on gesture failed:", e);
        }
      }
      window.removeEventListener('click', handleGesture);
    };
    window.addEventListener('click', handleGesture);
    return () => {
      window.removeEventListener('click', handleGesture);
    };
  }, []);

  // Monitor activePage changes to apply screen state dynamically
  useEffect(() => {
    const mode = localStorage.getItem('fullscreen_mode');
    
    if (mode === 'reading') {
      if (activePage === 'reader') {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => {
            console.warn("Enter reading fullscreen failed:", err);
          });
        }
      } else {
        if (document.exitFullscreen && document.fullscreenElement) {
          document.exitFullscreen().catch(err => {
            console.warn("Exit reading fullscreen failed:", err);
          });
        }
      }
    } else if (mode === 'always') {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn("Ensure always fullscreen failed:", err);
        });
      }
    } else if (mode === 'off') {
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.warn("Ensure off exit fullscreen failed:", err);
        });
      }
    }
  }, [activePage]);

  useEffect(() => {
    sessionStorage.setItem('kuroyomi_active_page', activePage);
  }, [activePage]);

  useEffect(() => {
    if (selectedMangaId !== null) {
      sessionStorage.setItem('kuroyomi_selected_manga_id', selectedMangaId.toString());
    } else {
      sessionStorage.removeItem('kuroyomi_selected_manga_id');
    }
  }, [selectedMangaId]);

  useEffect(() => {
    sessionStorage.setItem('kuroyomi_detail_back_page', detailBackPage);
  }, [detailBackPage]);

  useEffect(() => {
    if (readerMangaId !== null) {
      sessionStorage.setItem('kuroyomi_reader_manga_id', readerMangaId.toString());
    } else {
      sessionStorage.removeItem('kuroyomi_reader_manga_id');
    }
  }, [readerMangaId]);

  useEffect(() => {
    if (readerChapterId !== null) {
      sessionStorage.setItem('kuroyomi_reader_chapter_id', readerChapterId.toString());
    } else {
      sessionStorage.removeItem('kuroyomi_reader_chapter_id');
    }
  }, [readerChapterId]);

  const applyDefaultTheme = () => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const initialTheme = 'dark';
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
  };

  const applyUserTheme = async () => {
    try {
      const configs = await api.getSettings();
      const userTheme = (configs.theme as 'light' | 'dark') || 'dark';
      setTheme(userTheme);
      document.documentElement.setAttribute('data-theme', userTheme);
    } catch (e) {
      applyDefaultTheme();
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);

    if (isLoggedIn) {
      await api.updateSettings({ theme: newTheme });
    } else {
      localStorage.setItem('theme', newTheme);
    }
  };

  const handleLoginSuccess = (_username: string) => {
    setIsLoggedIn(true);
    setActivePage('library');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActivePage('library');
    sessionStorage.removeItem('kuroyomi_active_page');
    sessionStorage.removeItem('kuroyomi_selected_manga_id');
    sessionStorage.removeItem('kuroyomi_detail_back_page');
    sessionStorage.removeItem('kuroyomi_reader_manga_id');
    sessionStorage.removeItem('kuroyomi_reader_chapter_id');
  };

  const handleMangaSelect = (mangaId: number) => {
    setSelectedMangaId(mangaId);
    setDetailBackPage(activePage);
    setActivePage('manga-detail');
  };

  const handleChapterSelect = (mangaId: number, chapterId: number) => {
    setReaderMangaId(mangaId);
    setReaderChapterId(chapterId);
    setActivePage('reader');
  };

  const renderContent = () => {
    switch (activePage) {
      case 'library':
        return <LibraryPage onMangaSelect={handleMangaSelect} />;
      case 'browse':
        return <BrowsePage onMangaSelect={handleMangaSelect} />;
      case 'history':
        return (
          <HistoryPage
            onMangaSelect={handleMangaSelect}
            onChapterSelect={handleChapterSelect}
          />
        );
      case 'updates':
        return (
          <UpdatesPage
            onMangaSelect={handleMangaSelect}
            onChapterSelect={handleChapterSelect}
          />
        );
      case 'manga-detail':
        return selectedMangaId ? (
          <MangaDetailPage
            mangaId={selectedMangaId}
            onBack={() => setActivePage(detailBackPage)}
            onChapterSelect={handleChapterSelect}
          />
        ) : (
          <LibraryPage onMangaSelect={handleMangaSelect} />
        );
      case 'reader':
        return readerMangaId !== null && readerChapterId !== null ? (
          <ReaderPage
            mangaId={readerMangaId}
            chapterId={readerChapterId}
            onBack={() => setActivePage('manga-detail')}
            onChapterChange={(id) => setReaderChapterId(id)}
          />
        ) : (
          <LibraryPage onMangaSelect={handleMangaSelect} />
        );
      case 'settings':
        return <SettingsPage onLogout={handleLogout} />;
      default:
        return <LibraryPage onMangaSelect={handleMangaSelect} />;
    }
  };

  if (backendOnline === null) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#1a1b26',
        color: '#c0caf5',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div className="comic-box" style={{ backgroundColor: 'var(--retro-yellow)', padding: '1rem 2rem' }}>
          <h3 style={{ margin: 0, fontWeight: 900, color: '#1a1a1a' }}>CONNECTING TO BACKEND...</h3>
        </div>
      </div>
    );
  }

  if (backendOnline === false) {
    const isIndo = localStorage.getItem('lang') === 'id';
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#15161e',
        color: '#c0caf5',
        fontFamily: 'system-ui, sans-serif',
        padding: '1.5rem',
        boxSizing: 'border-box'
      }}>
        <div className="comic-box" style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#1a1b26',
          padding: '2rem',
          boxSizing: 'border-box',
          boxShadow: '8px 8px 0px var(--border-color)'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            margin: '0 0 1.5rem 0',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '-1px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            Server <span style={{ background: 'var(--retro-yellow)', color: '#1a1a1a', padding: '0 0.5rem', display: 'inline-block', transform: 'rotate(-2deg)' }}>
              Offline
            </span>
          </h1>

          <p style={{
            fontWeight: 600,
            fontSize: '0.95rem',
            lineHeight: 1.5,
            margin: '0 0 1.5rem 0',
            color: '#a9b1d6'
          }}>
            {isIndo 
              ? 'Kuroyomi tidak dapat terhubung ke backend Suwayomi-Server Anda saat ini. Silakan periksa URL server Anda.' 
              : 'Kuroyomi cannot connect to your Suwayomi-Server backend at the moment. Please verify your server URL.'}
          </p>

          <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{
                display: 'block',
                fontWeight: 800,
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                fontSize: '0.85rem',
                color: '#fff'
              }}>
                {isIndo ? 'URL BACKEND SUWAYOMI' : 'SUWAYOMI BACKEND URL'}
              </label>
              <input
                type="text"
                value={inputServerUrl}
                onChange={(e) => setInputServerUrl(e.target.value)}
                placeholder="https://suwayomi.domain.com"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '3px solid var(--border-color)',
                  borderRadius: '8px',
                  backgroundColor: '#1f2335',
                  color: '#fff',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxShadow: '3px 3px 0px var(--border-color)',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {connectionError && (
              <div className="comic-box" style={{
                backgroundColor: 'var(--retro-pink)',
                color: '#fff',
                padding: '0.75rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                lineHeight: 1.4,
                boxShadow: 'none'
              }}>
                {connectionError}
              </div>
            )}

            <button
              type="submit"
              disabled={testingConnection}
              className="comic-btn comic-btn-teal"
              style={{
                padding: '0.75rem',
                fontWeight: 900,
                fontSize: '1rem',
                width: '100%',
                marginTop: '0.5rem'
              }}
            >
              {testingConnection 
                ? (isIndo ? 'MENGHUBUNGKAN...' : 'CONNECTING...') 
                : (isIndo ? 'HUBUNGKAN SERVER' : 'CONNECT SERVER')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (activePage === 'reader') {
    return renderContent();
  }

  return (
    <Layout
      activeTab={activePage === 'manga-detail' ? 'library' : activePage}
      setActiveTab={(tab) => {
        setActivePage(tab as ActivePage);
      }}
      theme={theme}
      toggleTheme={toggleTheme}
    >
      {renderContent()}
    </Layout>
  );
}
