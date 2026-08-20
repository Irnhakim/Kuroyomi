import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { LibraryPage } from './pages/LibraryPage';
import { BrowsePage } from './pages/BrowsePage';
import { MangaDetailPage } from './pages/MangaDetailPage';
import { ReaderPage } from './pages/ReaderPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { auth } from './services/auth';
import { api } from './services/api';

type ActivePage = 'library' | 'browse' | 'settings' | 'manga-detail' | 'reader';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activePage, setActivePage] = useState<ActivePage>('library');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Detail selection
  const [selectedMangaId, setSelectedMangaId] = useState<number | null>(null);

  // Reader selection
  const [readerMangaId, setReaderMangaId] = useState<number | null>(null);
  const [readerChapterId, setReaderChapterId] = useState<number | null>(null);

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

  const applyDefaultTheme = () => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
  };

  const applyUserTheme = async () => {
    try {
      const configs = await api.getSettings();
      const userTheme = (configs.theme as 'light' | 'dark') || 'light';
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
  };

  const handleMangaSelect = (mangaId: number) => {
    setSelectedMangaId(mangaId);
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
      case 'manga-detail':
        return selectedMangaId ? (
          <MangaDetailPage
            mangaId={selectedMangaId}
            onBack={() => setActivePage('library')}
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

  return (
    <Layout
      activeTab={activePage === 'manga-detail' || activePage === 'reader' ? 'library' : activePage}
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
