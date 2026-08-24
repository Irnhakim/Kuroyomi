import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { ChapterUpdate } from '../services/api';
import { RefreshCw, BookOpen, Clock } from 'lucide-react';
import { useTranslation } from '../services/i18n';

interface UpdatesPageProps {
  onMangaSelect: (mangaId: number) => void;
  onChapterSelect: (mangaId: number, chapterId: number) => void;
}

export const UpdatesPage: React.FC<UpdatesPageProps> = ({
  onMangaSelect,
  onChapterSelect
}) => {
  const { t, language } = useTranslation();
  const [updates, setUpdates] = useState<ChapterUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUpdates = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const items = await api.getLibraryUpdates();
      setUpdates(items);
    } catch (e) {
      console.error("Failed to load library updates:", e);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadUpdates();
  }, []);

  const handleRefreshLibrary = async () => {
    setRefreshing(true);
    try {
      await api.triggerLibraryUpdate();
      alert(t('updates.refresh_started'));
      // Poll/reload updates in 5 seconds to see new items
      setTimeout(() => {
        loadUpdates(false);
        setRefreshing(false);
      }, 4000);
    } catch (e) {
      console.error("Failed to trigger library update:", e);
      setRefreshing(false);
    }
  };

  // Group updates by date
  const getGroupTitle = (timestamp: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const itemDate = new Date(timestamp);
    itemDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - itemDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t('updates.date.today');
    } else if (diffDays === 1) {
      return t('updates.date.yesterday');
    } else if (diffDays > 1 && diffDays < 7) {
      return t('updates.date.days_ago').replace('{count}', String(diffDays));
    } else {
      return new Date(timestamp).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // Grouping operation
  const groupedUpdates: { [dateStr: string]: ChapterUpdate[] } = {};
  updates.forEach(item => {
    const key = getGroupTitle(item.fetchedAt);
    if (!groupedUpdates[key]) {
      groupedUpdates[key] = [];
    }
    groupedUpdates[key].push(item);
  });

  return (
    <div className="history-page">
      <div className="category-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontWeight: 900, textTransform: 'uppercase', fontSize: '1.8rem' }}>
            <Clock size={32} style={{ color: 'var(--retro-teal)' }} />
            {t('updates.title')}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600, color: 'var(--muted-text)', fontSize: '0.95rem' }}>
            {t('updates.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefreshLibrary}
          disabled={refreshing}
          className="comic-btn comic-btn-teal"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', fontSize: '0.9rem', fontWeight: 900 }}
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? t('updates.refreshing') : t('updates.btn.refresh')}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="comic-box" style={{ display: 'inline-block', backgroundColor: 'var(--retro-yellow)' }}>
            <h3 style={{ margin: 0, fontWeight: 900 }}>{t('updates.state.loading')}</h3>
          </div>
        </div>
      ) : updates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="speech-bubble" style={{ display: 'inline-block', maxWidth: '500px' }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', lineHeight: '1.5' }}>
              {t('updates.empty')}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Object.keys(groupedUpdates).map((dateKey) => (
            <div key={dateKey}>
              <h2 style={{
                fontSize: '1rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                color: 'var(--retro-teal)',
                borderBottom: '2px solid var(--border-color)',
                paddingBottom: '0.25rem',
                marginBottom: '0.75rem',
                letterSpacing: '0.05em'
              }}>
                {dateKey}
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {groupedUpdates[dateKey].map((item) => (
                  <div
                    key={item.chapterId}
                    className="comic-box"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.6rem 1rem',
                      gap: '1rem',
                      backgroundColor: 'var(--bg-card)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      cursor: 'pointer',
                    }}
                    onClick={() => onChapterSelect(item.mangaId, item.chapterId)}
                  >
                    {/* Cover Thumbnail */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        onMangaSelect(item.mangaId);
                      }}
                      style={{
                        width: '48px',
                        height: '64px',
                        borderRadius: '4px',
                        border: '2px solid var(--border-color)',
                        overflow: 'hidden',
                        flexShrink: 0,
                        backgroundColor: 'var(--bg-body)',
                        boxShadow: '2px 2px 0px var(--border-color)',
                      }}
                    >
                      <img
                        src={item.mangaThumbnailUrl}
                        alt={item.mangaTitle}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/logo.png';
                        }}
                      />
                    </div>

                    {/* Metadata details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 
                        onClick={(e) => {
                          e.stopPropagation();
                          onMangaSelect(item.mangaId);
                        }}
                        className="manga-title-hover"
                        style={{
                          margin: 0,
                          fontSize: '0.95rem',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.mangaTitle}
                      </h3>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                        <span 
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: item.isRead ? 'var(--muted-text)' : 'var(--text-color)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          {!item.isRead && (
                            <span 
                              style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--retro-teal)'
                              }}
                            />
                          )}
                          {item.chapterName}
                        </span>
                      </div>
                    </div>

                    {/* Quick reading icon */}
                    <div 
                      style={{
                        padding: '0.4rem',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-body)',
                        border: '2px solid var(--border-color)',
                        boxShadow: '2px 2px 0px var(--border-color)',
                        color: 'var(--text-color)',
                        flexShrink: 0
                      }}
                    >
                      <BookOpen size={16} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
