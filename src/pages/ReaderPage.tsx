import React, { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { ArrowLeft, ChevronLeft, ChevronRight, LayoutList, BookOpen } from 'lucide-react';
import { useTranslation } from '../services/i18n';
import { useModal } from '../services/modal';

interface ReaderPageProps {
  mangaId: number;
  chapterId: number; // chapterId acts as chapterIndex in Suwayomi REST API
  onBack: () => void;
  onChapterChange: (id: number) => void;
}

interface LoadedChapter {
  id: number;
  name: string;
  pageCount: number;
}

export const ReaderPage: React.FC<ReaderPageProps> = ({
  mangaId,
  chapterId,
  onBack,
  onChapterChange
}) => {
  const { t } = useTranslation();
  const { alert } = useModal();
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [readingMode, setReadingMode] = useState<'single' | 'webtoon'>('webtoon');
  const [mangaDetail, setMangaDetail] = useState<any>(null);
  const [hudVisible, setHudVisible] = useState(true);
  const [failedPages, setFailedPages] = useState<Record<string, boolean>>({});
  const [reloadKeys, setReloadKeys] = useState<Record<string, number>>({});
  const retryCountRef = useRef<Record<string, number>>({});

  const handlePageError = (pageKey: string) => {
    const count = retryCountRef.current[pageKey] || 0;
    if (count < 1) {
      retryCountRef.current[pageKey] = count + 1;
      setTimeout(() => {
        setReloadKeys(prev => ({ ...prev, [pageKey]: (prev[pageKey] || 0) + 1 }));
      }, 2000);
    } else {
      setFailedPages(prev => ({ ...prev, [pageKey]: true }));
    }
  };
  const [loadedChapters, setLoadedChapters] = useState<LoadedChapter[]>([]);
  const [loadingNext, setLoadingNext] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  const loadingNextRef = useRef(false);
  const loadedChapterIdsRef = useRef<Set<number>>(new Set());
  const lastSavedPageRef = useRef<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const saveProgressTimerRef = useRef<any>(null);

  const activeChapter = loadedChapters.find(c => c.id === chapterId) || loadedChapters[0];

  const getPageSrc = (chId: number, idx: number) => {
    const baseUrl = api.getPageImageUrl(mangaId, chId, idx);
    const key = reloadKeys[`${chId}_${idx}`] || 0;
    return key > 0 ? `${baseUrl}?r=${key}` : baseUrl;
  };

  const handleReloadPage = (chId: number, idx: number) => {
    const pageKey = `${chId}_${idx}`;
    setFailedPages(prev => {
      const copy = { ...prev };
      delete copy[pageKey];
      return copy;
    });
    setReloadKeys(prev => ({
      ...prev,
      [pageKey]: (prev[pageKey] || 0) + 1
    }));
  };

  const renderErrorCard = (chId: number, idx: number) => (
    <div className="reader-error-placeholder comic-box" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      backgroundColor: 'var(--bg-card)',
      border: '3px solid var(--border-color)',
      maxWidth: '400px',
      margin: '2rem auto',
      textAlign: 'center',
      position: 'relative',
      zIndex: 20
    }}>
      <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, color: 'var(--retro-pink)', textTransform: 'uppercase' }}>
        Failed to load page {idx + 1}
      </h4>
      <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem', fontWeight: 600 }}>
        The server returned an error or the page image has not been seeded yet.
      </p>
      <button
        className="comic-btn comic-btn-yellow"
        style={{ position: 'relative', zIndex: 30 }}
        onClick={(e) => {
          e.stopPropagation();
          handleReloadPage(chId, idx);
        }}
      >
        Retry Page
      </button>
    </div>
  );

  const loadChapterAndPages = async () => {
    setLoading(true);
    setFailedPages({});
    setReloadKeys({});
    try {
      let chaptersList;
      let configs;
      let manga;

      try {
        [chaptersList, configs, manga] = await Promise.all([
          api.getMangaChapters(mangaId),
          api.getSettings(),
          api.getMangaDetails(mangaId)
        ]);
      } catch (firstErr: any) {
        console.warn("First load attempt failed, forcing manga details sync...", firstErr);
        // Force manga sync first to populate chapters database cache, then retry
        await api.getMangaDetailsFull(mangaId);
        
        // Retry fetch
        [chaptersList, configs, manga] = await Promise.all([
          api.getMangaChapters(mangaId),
          api.getSettings(),
          api.getMangaDetails(mangaId)
        ]);
      }

      setChapters(chaptersList);
      setMangaDetail(manga);

      if (configs.readerMode === 'paged-ltr') {
        setReadingMode('single');
      } else {
        setReadingMode('webtoon');
      }

      // Resolve chapterId (database ID) to REST index
      let resolvedIndex = chapterId;
      const matchingChapter = chaptersList.find(ch => ch.databaseId === chapterId || ch.id === chapterId);
      if (matchingChapter) {
        resolvedIndex = matchingChapter.id; // which is the index
      }

      // Fetch chapter details using resolved index
      const info = await api.getChapterDetails(mangaId, resolvedIndex);

      if (resolvedIndex !== chapterId) {
        onChapterChange(resolvedIndex);
      }

      setLoadedChapters([
        { id: resolvedIndex, name: info.name, pageCount: info.pageCount }
      ]);
      loadedChapterIdsRef.current = new Set([resolvedIndex]);

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
    const isAlreadyLoaded = loadedChapters.some(c => c.id === chapterId);
    if (!isAlreadyLoaded) {
      loadChapterAndPages();
    }
  }, [chapterId]);

  // Cleanup save progress timer on unmount
  useEffect(() => {
    return () => {
      if (saveProgressTimerRef.current) {
        clearTimeout(saveProgressTimerRef.current);
      }
    };
  }, []);

  // Keep only active chapter if switching back to single page mode
  useEffect(() => {
    if (readingMode === 'single' && loadedChapters.length > 1) {
      const active = loadedChapters.find(ch => ch.id === chapterId);
      if (active) {
        setLoadedChapters([active]);
        loadedChapterIdsRef.current = new Set([active.id]);
      }
    }
  }, [readingMode]);

  // Save to reading history - debounced to prevent server spam on scroll
  useEffect(() => {
    if (!activeChapter || !mangaDetail) return;

    const timer = setTimeout(() => {
      api.saveHistory({
        mangaId,
        mangaTitle: mangaDetail.title,
        mangaThumbnail: mangaDetail.thumbnailUrl,
        chapterId,
        chapterName: activeChapter.name,
        currentPage,
        pageCount: activeChapter.pageCount
      }).catch(err => console.error("Error saving history:", err));
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentPage, activeChapter, mangaDetail, mangaId, chapterId]);

  // Prefetch next pages in the background to offload server spike and improve client speed
  // Also preload first 3 pages of next chapter when near end (paged mode)
  useEffect(() => {
    if (!activeChapter) return;
    const nextPagesToPrefetch = [currentPage + 1, currentPage + 2, currentPage + 3];
    nextPagesToPrefetch.forEach(nextIdx => {
      if (nextIdx < activeChapter.pageCount) {
        const pageKey = `${chapterId}_${nextIdx}`;
        if (!failedPages[pageKey]) {
          const img = new Image();
          img.src = api.getPageImageUrl(mangaId, chapterId, nextIdx);
        }
      }
    });

    // Preload next chapter first pages when near end of current chapter (paged mode only)
    if (readingMode === 'single' && chapters.length > 0) {
      const isNearEnd = currentPage >= activeChapter.pageCount - 3;
      if (isNearEnd) {
        const sorted = [...chapters].sort((a, b) => a.sourceOrder - b.sourceOrder);
        const curIdx = sorted.findIndex(ch => ch.id === chapterId);
        if (curIdx !== -1 && curIdx + 1 < sorted.length) {
          const nextChId = sorted[curIdx + 1].id;
          [0, 1, 2].forEach(idx => {
            const img = new Image();
            img.src = api.getPageImageUrl(mangaId, nextChId, idx);
          });
        }
      }
    }
  }, [currentPage, activeChapter, mangaId, chapterId, failedPages, readingMode, chapters]);

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
  }, [currentPage, activeChapter, readingMode]);

  // Webtoon scroll progress tracking - tight rootMargin ensures only one page is matched at a time
  useEffect(() => {
    if (readingMode !== 'webtoon' || loadedChapters.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '-45% 0px -45% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const indexAttr = entry.target.getAttribute('data-page-index');
          const chIdAttr = entry.target.getAttribute('data-chapter-id');
          if (indexAttr !== null && chIdAttr !== null) {
            const pageIdx = parseInt(indexAttr, 10);
            const chId = parseInt(chIdAttr, 10);
            setCurrentPage(pageIdx);
            if (chId !== chapterId) {
              onChapterChange(chId);
            }
            saveProgress(chId, pageIdx);
          }
        }
      });
    }, observerOptions);

    const timer = setTimeout(() => {
      const images = document.querySelectorAll('.reader-page-image');
      images.forEach((img) => observer.observe(img));
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [readingMode, loadedChapters, chapterId]);

  // Save progress - debounced to prevent server spam during fast scrolling or page flips
  const saveProgress = (chId: number, pageIdx: number) => {
    const pageKey = `${chId}_${pageIdx}`;
    if (lastSavedPageRef.current === pageKey) return;

    const ch = loadedChapters.find(c => c.id === chId);
    if (!ch) return;

    lastSavedPageRef.current = pageKey;

    if (saveProgressTimerRef.current) {
      clearTimeout(saveProgressTimerRef.current);
    }

    saveProgressTimerRef.current = setTimeout(async () => {
      try {
        await api.updateProgress(mangaId, chId, pageIdx);
        const isLastPage = pageIdx === ch.pageCount - 1;
        if (isLastPage) {
          await api.markChapterRead(mangaId, chId, true);
        }
      } catch (e) {
        console.error(e);
        lastSavedPageRef.current = ''; // Reset on error to allow retries
      }
    }, 1500); // 1.5s debounce
  };

  // Navigate to adjacent chapters
  const navigateToChapterOffset = async (direction: 'next' | 'prev') => {
    if (chapters.length === 0) return;

    // Sort chapters by sourceOrder (lower sourceOrder means earlier in the book)
    const sorted = [...chapters].sort((a, b) => a.sourceOrder - b.sourceOrder);
    const currentIndex = sorted.findIndex(ch => ch.id === chapterId);

    if (currentIndex === -1) return;

    let targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < sorted.length) {
      setLoadedChapters([]); // Force reset to show loader when manually shifting
      loadedChapterIdsRef.current = new Set();
      onChapterChange(sorted[targetIndex].id);
    } else {
      await alert(direction === 'next' ? t('reader.last_chapter') : t('reader.first_chapter'));
    }
  };

  const handleNextPage = () => {
    if (!activeChapter) return;
    if (currentPage < activeChapter.pageCount - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      saveProgress(chapterId, nextPage);
      window.scrollTo(0, 0);
    } else {
      navigateToChapterOffset('next');
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      saveProgress(chapterId, prevPage);
      window.scrollTo(0, 0);
    } else {
      navigateToChapterOffset('prev');
    }
  };

  const toggleHud = () => {
    setHudVisible(!hudVisible);
  };

  const loadNextChapterIfNeeded = async () => {
    if (loadingNextRef.current || chapters.length === 0 || loadedChapters.length === 0) return;

    const lastLoadedCh = loadedChapters[loadedChapters.length - 1];
    const sorted = [...chapters].sort((a, b) => a.sourceOrder - b.sourceOrder);
    const currentIndex = sorted.findIndex(ch => ch.id === lastLoadedCh.id);

    if (currentIndex === -1) return;

    const nextIndex = currentIndex + 1;
    if (nextIndex >= sorted.length) return;

    const nextCh = sorted[nextIndex];
    if (loadedChapterIdsRef.current.has(nextCh.id)) return;

    loadingNextRef.current = true;
    setLoadingNext(true);
    try {
      const nextInfo = await api.getChapterDetails(mangaId, nextCh.id);

      // Append next chapter to loaded list (multi-chapter webtoon view)
      loadedChapterIdsRef.current.add(nextCh.id);
      setLoadedChapters(prev => [...prev, { id: nextCh.id, name: nextInfo.name, pageCount: nextInfo.pageCount }]);
    } catch (e) {
      console.error("Failed to load next chapter:", e);
    } finally {
      loadingNextRef.current = false;
      setLoadingNext(false);
    }
  };

  // Webtoon scroll beyond bottom detection
  useEffect(() => {
    if (readingMode !== 'webtoon' || chapters.length === 0 || loadedChapters.length === 0) return;

    let lastScrollTop = window.scrollY || document.documentElement.scrollTop;

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // Auto hide HUD on scroll if it's currently visible
      if (Math.abs(scrollTop - lastScrollTop) > 10) {
        setHudVisible(prev => {
          if (prev) return false;
          return prev;
        });
      }

      // Update scroll progress
      setScrollPercent(Math.min(1, (scrollTop + windowHeight) / docHeight));

      // Check if we are near the bottom of the page (within 1200px buffer)
      const isNearBottom = (scrollTop + windowHeight) >= (docHeight - 1200);

      if (isNearBottom) {
        loadNextChapterIfNeeded();
      }
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [readingMode, chapters, loadedChapters, loadingNext]);

  if (loading) {
    return (
      <div className="reader-container" style={{ justifyContent: 'center', height: '100vh', padding: 0 }}>
        <div className="comic-box" style={{ backgroundColor: 'var(--retro-yellow)' }}>
          <h3 style={{ margin: 0, fontWeight: 900 }}>{t('reader.state.loading')}</h3>
        </div>
      </div>
    );
  }

  if (loadedChapters.length === 0 || !activeChapter || activeChapter.pageCount <= 0) {
    return (
      <div className="reader-container" style={{ justifyContent: 'center', height: '100vh', padding: 0 }}>
        <div className="comic-box" style={{ backgroundColor: 'var(--retro-pink)', color: '#fff', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontWeight: 900 }}>{t('reader.state.no_pages')}</h3>
          <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>This chapter might not be loaded or parsed yet.</p>
          <button className="comic-btn comic-btn-white" onClick={onBack}>{t('reader.btn.back')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="reader-container" ref={containerRef}>
      {/* Progress Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '3px',
        width: `${readingMode === 'single'
          ? ((currentPage + 1) / activeChapter.pageCount * 100)
          : (scrollPercent * 100)}%`,
        backgroundColor: 'var(--retro-purple)',
        zIndex: 10000,
        transition: readingMode === 'single' ? 'width 0.2s ease' : 'none',
        pointerEvents: 'none',
      }} />
      {/* Floating HUD Header */}
      {hudVisible && (
        <div className="reader-hud-header">
          <div className="reader-hud-header-left">
            <button
              className="comic-btn comic-btn-white reader-hud-btn"
              onClick={onBack}
            >
              <ArrowLeft size={16} />
              <span>{t('reader.btn.back')}</span>
            </button>
            <div className="reader-hud-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              {mangaDetail?.title && (
                <div className="reader-hud-manga">
                  {mangaDetail.title}
                </div>
              )}
              <h4 className="reader-hud-title">
                {activeChapter?.name}
              </h4>
              <span className="comic-sticker sticker-purple reader-hud-badge">
                PAGE {readingMode === 'single' ? `${currentPage + 1} / ${activeChapter.pageCount}` : `LONG STRIP`}
              </span>
            </div>
          </div>

          <div className="reader-hud-header-right">
            <button
              className={`comic-btn reader-hud-btn ${readingMode === 'single' ? 'comic-btn-yellow' : 'comic-btn-white'}`}
              onClick={() => setReadingMode('single')}
              title="Single Page Mode"
            >
              <BookOpen size={16} />
              <span>{t('reader.btn.paged')}</span>
            </button>
            <button
              className={`comic-btn reader-hud-btn ${readingMode === 'webtoon' ? 'comic-btn-yellow' : 'comic-btn-white'}`}
              onClick={() => setReadingMode('webtoon')}
              title="Webtoon Mode"
            >
              <LayoutList size={16} />
              <span>{t('reader.btn.webtoon')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Pages Canvas */}
      <div
        className={`reader-canvas-wrap ${hudVisible ? 'hud-active' : ''}`}
        onClick={toggleHud}
      >
        {readingMode === 'single' ? (
          /* SINGLE PAGE MODE */
          <div
            className="reader-single-wrap"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => { touchStartXRef.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchStartXRef.current === null) return;
              const diff = touchStartXRef.current - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 50) {
                if (diff > 0) handleNextPage();
                else handlePrevPage();
              }
              touchStartXRef.current = null;
            }}
          >
            <div
              className="reader-nav-zone-prev"
              onClick={handlePrevPage}
            />

            {failedPages[`${chapterId}_${currentPage}`] ? (
              renderErrorCard(chapterId, currentPage)
            ) : (
              <img
                src={getPageSrc(chapterId, currentPage)}
                alt={`Page ${currentPage + 1}`}
                className="reader-img"
                style={{ userSelect: 'none' }}
                onClick={toggleHud}
                onError={() => handlePageError(`${chapterId}_${currentPage}`)}
              />
            )}

            <div
              className="reader-nav-zone-next"
              onClick={handleNextPage}
            />
          </div>
        ) : (
          /* WEBTOON MODE */
          <div className="reader-webtoon-container" onClick={(e) => e.stopPropagation()}>
            {loadedChapters.map((ch) => (
              <div key={ch.id} className="reader-webtoon-chapter" data-chapter-id={ch.id}>
                {/* Chapter title separator */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '2rem 0',
                  backgroundColor: 'var(--bg-color)'
                }}>
                  <div className="comic-sticker sticker-purple" style={{
                    transform: 'none',
                    fontSize: '1rem',
                    fontWeight: 900,
                    padding: '0.5rem 1rem',
                    boxShadow: '3px 3px 0 var(--border-color)',
                    border: '3px solid var(--border-color)'
                  }}>
                    {ch.name}
                  </div>
                </div>

                {Array.from({ length: ch.pageCount }).map((_, idx) => {
                  const pageKey = `${ch.id}_${idx}`;
                  return failedPages[pageKey] ? (
                    <div key={pageKey} style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {renderErrorCard(ch.id, idx)}
                    </div>
                  ) : (
                    <img
                      key={pageKey}
                      data-chapter-id={ch.id}
                      data-page-index={idx}
                      src={getPageSrc(ch.id, idx)}
                      alt={`Page ${idx + 1}`}
                      className="reader-webtoon-img reader-page-image"
                      loading="lazy"
                      onClick={toggleHud}
                      onError={() => handlePageError(pageKey)}
                    />
                  );
                })}
              </div>
            ))}

            {loadingNext && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '3rem 0',
                backgroundColor: 'var(--bg-color)'
              }}>
                <div className="comic-box" style={{ backgroundColor: 'var(--retro-yellow)', padding: '0.75rem 1.5rem' }}>
                  <h4 style={{ margin: 0, fontWeight: 900 }}>LOADING NEXT CHAPTER...</h4>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Bottom HUD Banner */}
      {hudVisible && (
        <div className="reader-hud-footer">
          <button
            className="comic-btn comic-btn-white reader-hud-btn"
            onClick={() => navigateToChapterOffset('prev')}
          >
            <ChevronLeft size={16} />
            <span>{t('reader.btn.prev')}</span>
          </button>

          {readingMode === 'single' && (
            <div className="reader-hud-page-controls">
              <button
                className="comic-btn comic-btn-white reader-hud-page-btn"
                onClick={handlePrevPage}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="reader-hud-page-number">
                {currentPage + 1} / {activeChapter.pageCount}
              </span>
              <button
                className="comic-btn comic-btn-white reader-hud-page-btn"
                onClick={handleNextPage}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <button
            className="comic-btn comic-btn-yellow reader-hud-btn"
            onClick={() => navigateToChapterOffset('next')}
          >
            <span>{t('reader.btn.next')}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Permanent Page Counter */}
      {!hudVisible && (
        <div className="reader-permanent-counter">
          {currentPage + 1} / {activeChapter.pageCount}
        </div>
      )}
    </div>
  );
};