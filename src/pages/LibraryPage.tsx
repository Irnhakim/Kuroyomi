import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Manga, Category } from '../services/api';
import { RefreshCw, AlertCircle, Search } from 'lucide-react';
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

  const loadLibrary = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch categories
      const cats = await api.getCategories();
      setCategories(cats);

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

  const filteredMangas = mangas.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.author?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {categories.map((cat) => (
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
            {cat.name}
          </button>
        ))}

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
      </div>

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
      ) : filteredMangas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="speech-bubble" style={{ display: 'inline-block', maxWidth: '400px', textAlign: 'left' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, textTransform: 'uppercase' }}>{t('library.title')}</h3>
            <p style={{ margin: 0, fontWeight: 500, lineHeight: 1.4 }}>
              {searchQuery ? t('library.empty.search') : t('library.empty.desc')}
            </p>
          </div>
        </div>
      ) : (
        <div className="comic-grid">
          {filteredMangas.map((manga, idx) => {
            // Apply slight random rotation for playful cartoonist layout
            const rotation = (idx % 3 === 0) ? '-1.5deg' : (idx % 3 === 1) ? '1deg' : '-0.5deg';
            return (
              <div
                key={manga.id}
                className="comic-box comic-box-interactive"
                style={{
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  transform: `rotate(${rotation})`,
                  height: '100%',
                  boxSizing: 'border-box'
                }}
                onClick={() => onMangaSelect(manga.id)}
              >
                {/* Comic Thumbnail Cover */}
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
                      // Fallback image if fetch fails
                      (e.target as HTMLImageElement).src = '/logo.svg';
                    }}
                  />
                  {/* Sticker Indicator for completed status */}
                  {manga.status === 'COMPLETED' && (
                    <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
                      <span className="comic-sticker sticker-teal" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem' }}>
                        {t('library.manga.done')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Title & Author */}
                <div style={{ marginTop: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{
                    margin: 0,
                    fontWeight: 900,
                    fontSize: '1.1rem',
                    lineHeight: 1.2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    height: '2.4rem'
                  }} title={manga.title}>
                    {manga.title}
                  </h3>
                  <p style={{
                    margin: '0.4rem 0 0 0',
                    fontSize: '0.8rem',
                    color: 'var(--muted-text)',
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {manga.author || t('library.manga.unknown_author')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
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
      `}</style>
    </div>
  );
};
