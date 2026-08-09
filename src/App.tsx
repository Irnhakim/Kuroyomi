import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { LibraryPage } from './pages/LibraryPage';
import { BrowsePage } from './pages/BrowsePage';
import { MangaDetailPage } from './pages/MangaDetailPage';
import { ReaderPage } from './pages/ReaderPage';
import { SettingsPage } from './pages/SettingsPage';

type ActivePage = 'library' | 'browse' | 'settings' | 'manga-detail' | 'reader';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('library');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Detail selection
  const [selectedMangaId, setSelectedMangaId] = useState<number | null>(null);
  
  // Reader selection
  const [readerMangaId, setReaderMangaId] = useState<number | null>(null);
  const [readerChapterIndex, setReaderChapterIndex] = useState<number | null>(null);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
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
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleMangaSelect = (mangaId: number) => {
    setSelectedMangaId(mangaId);
    setActivePage('manga-detail');
  };

  const handleChapterSelect = (mangaId: number, chapterIndex: number) => {
    setReaderMangaId(mangaId);
    setReaderChapterIndex(chapterIndex);
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
        return readerMangaId !== null && readerChapterIndex !== null ? (
          <ReaderPage
            mangaId={readerMangaId}
            chapterIndex={readerChapterIndex}
            onBack={() => setActivePage('manga-detail')}
            onChapterChange={(idx) => setReaderChapterIndex(idx)}
            totalChapters={100} // Simple limit fallback
          />
        ) : (
          <LibraryPage onMangaSelect={handleMangaSelect} />
        );
      case 'settings':
        return <SettingsPage />;
      default:
        return <LibraryPage onMangaSelect={handleMangaSelect} />;
    }
  };

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
