import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import type { Manga, Category, Chapter, HistoryItem } from '../services/api';
import { RefreshCw, AlertCircle, Search, ArrowUpDown, ArrowUp, ArrowDown, Circle, LayoutGrid, Grid3X3, List } from 'lucide-react';
import { useTranslation } from '../services/i18n';

interface LibraryPageProps {
  onMangaSelect: (mangaId: number) => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ onMangaSelect }) => {
  const { t } = useTranslation();
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number>(-1); // -1 is All / Default
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState<'grid' | 'compact' | 'list'>(() => {
    return (localStorage.getItem('kuroyomi_library_display_mode') as any) || 'grid';
  });

  // Sort & Filter states
  const [sortBy, setSortBy] = useState<'unread' | 'total' | 'az' | 'added' | 'read' | 'fetched' | 'uploaded' | 'random'>(() => {
    return (localStorage.getItem('kuroyomi_library_sort_by') as any) || 'added';
  });
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => {
    return (localStorage.getItem('kuroyomi_library_sort_dir') as any) || 'desc';
  });
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [chaptersData, setChaptersData] = useState<Record<number, Chapter[]>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Persist sort settings
  useEffect(() => {
    localStorage.setItem('kuroyomi_library_sort_by', sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem('kuroyomi_library_sort_dir', sortDirection);
  }, [sortDirection]);

  useEffect(() => {
    localStorage.setItem('kuroyomi_library_display_mode', displayMode);
  }, [displayMode]);

  // Generate stable random order values
  const randomOrderMap = useMemo(() => {
    const map: Record<number, number> = {};
    mangas.forEach((manga) => {
      map[manga.id] = Math.random();
    });
    return map;
  }, [mangas.length]);

  const loadLibrary = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch categories
      const cats = await api.getCategories();
      setCategories(cats);

      // Fetch history
      try {
        const hist = await api.getHistory();
        setHistory(hist);
      } catch (e) {
        console.error('Failed to load history', e);
      }

      // Fetch library manga
      let list: Manga[] = [];
      if (selectedCategory === -1) {
        list = await api.getLibrary();
      } else {
        list = await api.getCategoryMangas(selectedCategory);
      }
      setMangas(list);
    } catch (err) {
      console.error(err);
      setError('Could not load library. Make sure Suwayomi-Server is running on port 4567.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, [selectedCategory]);

  // Fetch chapters for all library mangas in background
  useEffect(() => {
    if (mangas.length === 0) return;

    let active = true;
    const fetchAllChapters = async () => {
      const missingIds = mangas.map(m => m.id).filter(id => !chaptersData[id]);
      if (missingIds.length === 0) return;

      const results = await Promise.all(
        missingIds.map(async (id) => {
          try {
            const chs = await api.getMangaChapters(id);
            return { id, chs };
          } catch (e) {
            console.error(`Failed to fetch chapters for manga ${id}`, e);
            return { id, chs: [] };
          }
        })
      );

      if (!active) return;
      setChaptersData(prev => {
        const next = { ...prev };
        results.forEach(({ id, chs }) => {
          next[id] = chs;
        });
        return next;
      });
    };

    fetchAllChapters();
    return () => {
      active = false;
    };
  }, [mangas]);

  const filteredMangas = mangas.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedMangas = useMemo(() => {
    const listCopy = [...filteredMangas];

    const getReadAt = (mangaId: number) => {
      const item = history.find(h => h.mangaId === mangaId);
      return item ? item.readAt : 0;
    };

    const getTotalChapters = (mangaId: number) => {
      return (chaptersData[mangaId] || []).length;
    };

    const getUnreadChapters = (mangaId: number) => {
      return (chaptersData[mangaId] || []).filter(c => !c.read).length;
    };

    const getLatestUploaded = (mangaId: number) => {
      const chs = chaptersData[mangaId] || [];
      if (chs.length === 0) return 0;
      return Math.max(...chs.map(c => c.dateUpload || 0));
    };

    const getLatestFetched = (mangaId: number) => {
      const chs = chaptersData[mangaId] || [];
      return chs[0]?.dateUpload || 0;
    };

    listCopy.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'unread':
          comparison = getUnreadChapters(a.id) - getUnreadChapters(b.id);
          break;
        case 'total':
          comparison = getTotalChapters(a.id) - getTotalChapters(b.id);
          break;
        case 'az':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'added':
          comparison = mangas.findIndex(m => m.id === a.id) - mangas.findIndex(m => m.id === b.id);
          break;
        case 'read':
          comparison = getReadAt(a.id) - getReadAt(b.id);
          break;
        case 'fetched':
          comparison = getLatestFetched(a.id) - getLatestFetched(b.id);
          break;
        case 'uploaded':
          comparison = getLatestUploaded(a.id) - getLatestUploaded(b.id);
          break;
        case 'random':
          comparison = (randomOrderMap[a.id] || 0) - (randomOrderMap[b.id] || 0);
          break;
        default:
          comparison = 0;
      }

      if (comparison === 0 && sortBy !== 'az') {
        comparison = a.title.localeCompare(b.title);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return listCopy;
  }, [filteredMangas, sortBy, sortDirection, chaptersData, history, randomOrderMap, mangas]);

  return (
    <div>
      {/* Page Title with cartoon speech bubble style */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px' }}>
            My <span style={{ background: 'var(--retro-pink)', color: '#fff', padding: '0 0.5rem', display: 'inline-block', transform: 'rotate(-2deg)' }}>{t('library.title')}</span>
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', fontWeight: 500, color: 'var(--muted-text)' }}>
            {t('library.subtitle')}
          </p>
        </div>

        <button className="comic-btn comic-btn-teal" onClick={loadLibrary} disabled={loading}>
          <RefreshCw className={loading ? 'spin-anim' : ''} size={18} />
          {loading ? t('library.refreshing') : t('library.refresh')}
        </button>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs-wrap">
        <button
          className="comic-btn"
          style={{
            backgroundColor: selectedCategory === -1 ? 'var(--retro-purple)' : 'var(--bg-card)',
            color: selectedCategory === -1 ? '#fff' : 'var(--text-color)',
            padding: '0.5rem 1rem',
            fontSize: '0.9rem'
          }}
          onClick={() => setSelectedCategory(-1)}
        >
          {t('library.all')}
        </button>
        {categories.map((cat) => {
          const lowerName = cat.name.toLowerCase();
          const displayName =
            lowerName === 'membaca' || lowerName === 'reading' ? t('category.reading') :
            lowerName === 'selesai' || lowerName === 'completed' ? t('category.completed') :
            cat.name;
          return (
            <button
              key={cat.id}
              className="comic-btn"
              style={{
                backgroundColor: selectedCategory === cat.id ? 'var(--retro-purple)' : 'var(--bg-card)',
                color: selectedCategory === cat.id ? '#fff' : 'var(--text-color)',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem'
              }}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {displayName}
            </button>
          );
        })}

        {/* Sort & Filter Button */}
        <button
          className="comic-btn"
          style={{
            backgroundColor: showSortMenu ? 'var(--retro-yellow)' : 'var(--bg-card)',
            color: showSortMenu ? '#000' : 'var(--text-color)',
            padding: '0.5rem 1rem',
            fontSize: '0.9rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer'
          }}
          onClick={() => setShowSortMenu(!showSortMenu)}
        >
          <ArrowUpDown size={16} />
          {t('library.sort')}
        </button>

        {/* Search Bar */}
        <div className="search-bar-wrap">
          <Search size={18} style={{ marginRight: '0.5rem', color: 'var(--muted-text)' }} />
          <input
            type="text"
            placeholder={t('library.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-color)',
              fontFamily: 'inherit',
              fontWeight: 600,
              fontSize: '0.95rem',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>

        {/* Display Mode Toggle */}
        <div style={{ display: 'flex', border: '2px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', height: '36px', boxSizing: 'border-box', boxShadow: '2px 2px 0 var(--border-color)', flexShrink: 0 }}>
          <button
            onClick={() => setDisplayMode('grid')}
            style={{
              padding: '0 0.6rem',
              backgroundColor: displayMode === 'grid' ? 'var(--retro-purple)' : 'var(--bg-card)',
              color: displayMode === 'grid' ? '#fff' : 'var(--text-color)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              transition: 'background-color 0.2s'
            }}
            title="Grid Mode"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setDisplayMode('compact')}
            style={{
              padding: '0 0.6rem',
              backgroundColor: displayMode === 'compact' ? 'var(--retro-purple)' : 'var(--bg-card)',
              color: displayMode === 'compact' ? '#fff' : 'var(--text-color)',
              borderLeft: '2px solid var(--border-color)',
              borderRight: '2px solid var(--border-color)',
              borderTop: 'none',
              borderBottom: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              transition: 'background-color 0.2s'
            }}
            title="Compact Grid Mode"
          >
            <Grid3X3 size={18} />
          </button>
          <button
            onClick={() => setDisplayMode('list')}
            style={{
              padding: '0 0.6rem',
              backgroundColor: displayMode === 'list' ? 'var(--retro-purple)' : 'var(--bg-card)',
              color: displayMode === 'list' ? '#fff' : 'var(--text-color)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              transition: 'background-color 0.2s'
            }}
            title="List Mode"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Sort Options Panel */}
      {showSortMenu && (
        <div className="comic-box" style={{
          backgroundColor: 'var(--bg-card)',
          padding: '1rem',
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          maxWidth: '320px',
          boxSizing: 'border-box'
        }}>
          {[
            { type: 'unread', label: t('library.sort.unread') },
            { type: 'total', label: t('library.sort.total') },
            { type: 'az', label: t('library.sort.az') },
            { type: 'added', label: t('library.sort.added') },
            { type: 'read', label: t('library.sort.read') },
            { type: 'fetched', label: t('library.sort.fetched') },
            { type: 'uploaded', label: t('library.sort.uploaded') },
            { type: 'random', label: t('library.sort.random') }
          ].map((option) => {
            const isActive = sortBy === option.type;
            return (
              <div
                key={option.type}
                onClick={() => {
                  if (isActive) {
                    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy(option.type as any);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  color: 'var(--text-color)',
                  userSelect: 'none',
                  transition: 'background-color 0.2s'
                }}
                className="sort-option-item"
              >
                {isActive ? (
                  sortDirection === 'asc' ? (
                    <ArrowUp size={20} style={{ color: 'var(--retro-purple)' }} />
                  ) : (
                    <ArrowDown size={20} style={{ color: 'var(--retro-purple)' }} />
                  )
                ) : (
                  <Circle size={20} style={{ color: 'var(--muted-text)', opacity: 0.6 }} />
                )}
                <span>{option.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Library View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <div className="comic-box" style={{ display: 'inline-block', backgroundColor: 'var(--retro-yellow)' }}>
            <h3 style={{ margin: 0, fontWeight: 900 }}>{t('library.loading')}</h3>
          </div>
        </div>
      ) : error ? (
        <div className="comic-box" style={{ backgroundColor: 'var(--retro-pink)', color: '#fff', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <AlertCircle size={32} />
          <div>
            <h3 style={{ margin: 0, fontWeight: 900 }}>{t('library.error')}</h3>
            <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600 }}>{error}</p>
          </div>
        </div>
      ) : sortedMangas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="speech-bubble" style={{ display: 'inline-block', maxWidth: '400px', textAlign: 'left' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, textTransform: 'uppercase' }}>{t('library.title')}</h3>
            <p style={{ margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
              {searchQuery ? t('library.empty.search') : t('library.empty.desc')}
            </p>
          </div>
        </div>
      ) : (
        displayMode === 'list' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {sortedMangas.map((manga) => (
              <div
                key={manga.id}
                className="comic-box comic-box-interactive"
                style={{
                  padding: '0.5rem 0.75rem',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => onMangaSelect(manga.id)}
              >
                <img
                  src={api.getMangaThumbnailUrl(manga)}
                  alt={manga.title}
                  style={{
                    width: '50px',
                    height: '70px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '2px solid var(--border-color)',
                    flexShrink: 0
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.svg';
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {manga.title}
                  </h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: 'var(--muted-text)', fontWeight: 700 }}>
                    {manga.author || t('library.manga.unknown_author')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : displayMode === 'compact' ? (
          <div className="comic-grid-compact" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '0.4rem', padding: '0px' }}>
            {sortedMangas.map((manga) => {
              return (
                <div
                  key={manga.id}
                  className="comic-box comic-box-interactive"
                  style={{
                    padding: '0px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    boxSizing: 'border-box',
                    borderRadius: '6px',
                    border: '2px solid var(--border-color)',
                    position: 'relative'
                  }}
                  onClick={() => onMangaSelect(manga.id)}
                >
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '140%',
                    overflow: 'hidden',
                    backgroundColor: '#eee'
                  }}>
                    <img
                      src={api.getMangaThumbnailUrl(manga)}
                      alt={manga.title}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.svg';
                      }}
                    />
                    
                    {/* Title Overlay with Gradient backdrop */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
                      padding: '0.4rem',
                      boxSizing: 'border-box',
                      color: '#fff',
                      zIndex: 5
                    }}>
                      <h4 style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        lineHeight: 1.1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }} title={manga.title}>
                        {manga.title}
                      </h4>
                    </div>

                    {/* Completed / Library Indicators */}
                    {manga.status === 'COMPLETED' && (
                      <div style={{ position: 'absolute', top: '4px', right: '4px', zIndex: 10 }}>
                        <span className="comic-sticker sticker-teal" style={{ fontSize: '0.5rem', padding: '0.1rem 0.3rem' }}>
                          {t('library.manga.done')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="comic-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.8rem' }}>
            {sortedMangas.map((manga) => {
              return (
                <div
                  key={manga.id}
                  className="comic-box comic-box-interactive"
                  style={{
                    padding: '0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    boxSizing: 'border-box'
                  }}
                  onClick={() => onMangaSelect(manga.id)}
                >
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '140%', // Comic ratio
                    overflow: 'hidden',
                    borderRadius: '6px',
                    border: '2px solid var(--border-color)',
                    backgroundColor: '#eee'
                  }}>
                    <img
                      src={api.getMangaThumbnailUrl(manga)}
                      alt={manga.title}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.svg';
                      }}
                    />
                    {manga.status === 'COMPLETED' && (
                      <div style={{ position: 'absolute', top: '6px', right: '6px', zIndex: 10 }}>
                        <span className="comic-sticker sticker-teal" style={{ fontSize: '0.55rem', padding: '0.15rem 0.35rem' }}>
                          {t('library.manga.done')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '0.5rem', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <h3 style={{
                      margin: 0,
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--text-color)'
                    }} title={manga.title}>
                      {manga.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* CSS Animation helper */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-anim {
          animation: spin 1s linear infinite;
        }
        .sort-option-item:hover {
          background-color: var(--bg-body) !important;
        }
      `}</style>
    </div>
  );
};
