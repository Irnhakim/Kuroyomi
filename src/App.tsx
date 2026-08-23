import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { LibraryPage } from './pages/LibraryPage';
import { BrowsePage } from './pages/BrowsePage';
import { MangaDetailPage } from './pages/MangaDetailPage';
import { ReaderPage } from './pages/ReaderPage';
import { SettingsPage } from './pages/SettingsPage';
import { HistoryPage } from './pages/HistoryPage';
import { LoginPage } from './pages/LoginPage';
import { auth } from './services/auth';
import { api } from './services/api';

type ActivePage = 'library' | 'browse' | 'settings' | 'manga-detail' | 'reader' | 'history';

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
