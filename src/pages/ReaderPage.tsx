import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { ArrowLeft, ChevronLeft, ChevronRight, LayoutList, BookOpen } from 'lucide-react';

interface ReaderPageProps {
  mangaId: number;
  chapterId: number; // chapterId acts as chapterIndex in Suwayomi REST API
  onBack: () => void;
  onChapterChange: (id: number) => void;
}

export const ReaderPage: React.FC<ReaderPageProps> = ({
  mangaId,
  chapterId,
  onBack,
  onChapterChange
}) => {
  const [chapterInfo, setChapterInfo] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [readingMode, setReadingMode] = useState<'single' | 'webtoon'>('single');
  const [hudVisible, setHudVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadChapterAndPages = async () => {
    setLoading(true);
    try {
      const [info, chaptersList, configs] = await Promise.all([
        api.getChapterDetails(mangaId, chapterId),
        api.getMangaChapters(mangaId),
        api.getSettings()
      ]);
      setChapterInfo(info);
      setChapters(chaptersList);
      
      if (configs.readerMode === 'webtoon') {
        setReadingMode('webtoon');
      } else {
        setReadingMode('single');
      }
      
      if (info.lastPageRead && info.lastPageRead > 0) {
        setCurrentPage(Math.min(info.lastPageRead, info.pageCount - 1));
      } else {
        setCurrentPage(0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChapterAndPages();
  }, [chapterId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readingMode !== 'single') return;
      if (e.key === 'ArrowRight') {
        handleNextPage();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, chapterInfo, readingMode]);

  // Save progress
  const saveProgress = async (pageIdx: number) => {
    if (!chapterInfo) return;
    try {
      await api.updateProgress(mangaId, chapterId, pageIdx);
      const isLastPage = pageIdx === chapterInfo.pageCount - 1;
      if (isLastPage) {
        await api.markChapterRead(mangaId, chapterId, true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Navigate to adjacent chapters
  const navigateToChapterOffset = (direction: 'next' | 'prev') => {
    if (chapters.length === 0) return;
    
    // Sort chapters by sourceOrder (lower sourceOrder means earlier in the book)
    const sorted = [...chapters].sort((a, b) => a.sourceOrder - b.sourceOrder);
    const currentIndex = sorted.findIndex(ch => ch.id === chapterId);
    
    if (currentIndex === -1) return;
    
    let targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < sorted.length) {
      onChapterChange(sorted[targetIndex].id);
    } else {
      alert(direction === 'next' ? "You've reached the last chapter!" : "You are on the first chapter!");
    }
  };

  const handleNextPage = () => {
    if (!chapterInfo) return;
    if (currentPage < chapterInfo.pageCount - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      saveProgress(nextPage);
      window.scrollTo(0, 0);
    } else {
      navigateToChapterOffset('next');
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      saveProgress(prevPage);
      window.scrollTo(0, 0);
    } else {
      navigateToChapterOffset('prev');
    }
  };

  const toggleHud = () => {
    setHudVisible(!hudVisible);
  };

  if (loading) {
    return (
      <div className="reader-container" style={{ justifyContent: 'center', height: '100vh', padding: 0 }}>
        <div className="comic-box" style={{ backgroundColor: 'var(--retro-yellow)' }}>
          <h3 style={{ margin: 0, fontWeight: 900 }}>LOADING MANGA PAGES...</h3>
        </div>
      </div>
    );
  }

  if (!chapterInfo || chapterInfo.pageCount <= 0) {
    return (
      <div className="reader-container" style={{ justifyContent: 'center', height: '100vh', padding: 0 }}>
        <div className="comic-box" style={{ backgroundColor: 'var(--retro-pink)', color: '#fff', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontWeight: 900 }}>NO PAGES DETECTED</h3>
          <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>This chapter might not be loaded or parsed yet.</p>
          <button className="comic-btn comic-btn-white" onClick={onBack}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="reader-container" ref={containerRef}>
      {/* Floating HUD Header */}
      {hudVisible && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '900px',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-card)',
          border: '3px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '4px 4px 0px var(--border-color)',
          padding: '0.75rem 1.5rem',
          color: 'var(--text-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="comic-btn comic-btn-white"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              onClick={onBack}
            >
              <ArrowLeft size={16} />
              Exit
            </button>
            <div>
              <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}>
                {chapterInfo?.name}
              </h4>
              <span className="comic-sticker sticker-purple" style={{ fontSize: '0.6rem', transform: 'none', marginTop: '0.2rem' }}>
                PAGE {readingMode === 'single' ? `${currentPage + 1} / ${chapterInfo.pageCount}` : `LONG STRIP`}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              className={`comic-btn ${readingMode === 'single' ? 'comic-btn-yellow' : 'comic-btn-white'}`}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              onClick={() => setReadingMode('single')}
              title="Single Page Mode"
            >
              <BookOpen size={16} />
              Single
            </button>
            <button
              className={`comic-btn ${readingMode === 'webtoon' ? 'comic-btn-yellow' : 'comic-btn-white'}`}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              onClick={() => setReadingMode('webtoon')}
              title="Webtoon Mode"
            >
              <LayoutList size={16} />
              Scroll
            </button>
          </div>
        </div>
      )}

      {/* Main Pages Canvas */}
      <div 
        style={{
          marginTop: hudVisible ? '6rem' : '1rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          cursor: 'pointer'
        }}
        onClick={toggleHud}
      >
        {readingMode === 'single' ? (
          /* SINGLE PAGE MODE */
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
            <div 
              style={{ position: 'absolute', left: 0, top: 0, width: '25%', height: '100%', zIndex: 10, cursor: 'w-resize' }}
              onClick={handlePrevPage}
            />

            <img
              src={api.getPageImageUrl(mangaId, chapterId, currentPage)}
              alt={`Page ${currentPage + 1}`}
              className="reader-img"
              style={{ userSelect: 'none' }}
              onClick={toggleHud}
            />

            <div 
              style={{ position: 'absolute', right: 0, top: 0, width: '25%', height: '100%', zIndex: 10, cursor: 'e-resize' }}
              onClick={handleNextPage}
            />
          </div>
        ) : (
          /* WEBTOON MODE */
          <div className="reader-webtoon-container" onClick={(e) => e.stopPropagation()}>
            {Array.from({ length: chapterInfo.pageCount }).map((_, idx) => (
              <img
                key={idx}
                src={api.getPageImageUrl(mangaId, chapterId, idx)}
                alt={`Page ${idx + 1}`}
                className="reader-webtoon-img"
                loading="lazy"
                onClick={toggleHud}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Navigator */}
      {readingMode === 'single' && hudVisible && (
        <div style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          backgroundColor: 'var(--bg-card)',
          border: '3px solid var(--border-color)',
          borderRadius: '30px',
          boxShadow: '4px 4px 0px var(--border-color)',
          padding: '0.5rem 1rem'
        }}>
          <button className="comic-btn comic-btn-white" style={{ padding: '0.4rem 0.8rem', borderRadius: '50%' }} onClick={handlePrevPage}>
            <ChevronLeft size={20} />
          </button>
          
          <span style={{ fontWeight: 900, color: 'var(--text-color)', fontSize: '1rem' }}>
            {currentPage + 1} / {chapterInfo.pageCount}
          </span>

          <button className="comic-btn comic-btn-white" style={{ padding: '0.4rem 0.8rem', borderRadius: '50%' }} onClick={handleNextPage}>
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};
