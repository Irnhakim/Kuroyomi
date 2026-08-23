import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { HistoryItem } from '../services/api';
import { Trash2, Clock, BookOpen } from 'lucide-react';
import { useTranslation } from '../services/i18n';

interface HistoryPageProps {
  onMangaSelect: (mangaId: number) => void;
  onChapterSelect?: (mangaId: number, chapterId: number) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onMangaSelect,
  onChapterSelect
}) => {
  const { t } = useTranslation();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const items = await api.getHistory();
      setHistoryItems(items);
    } catch (e) {
      console.error("Failed to load reading history:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDeleteItem = async (e: React.MouseEvent, mangaId: number) => {
    e.stopPropagation();
    if (window.confirm("Remove this manga from history?")) {
      const toDelete = historyItems.filter(h => h.mangaId === mangaId);
      for (const h of toDelete) {
        await api.deleteHistoryItem(h.mangaId, h.chapterId);
      }
      await loadHistory();
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Clear all reading history? This cannot be undone.")) {
      await api.clearHistory();
      await loadHistory();
    }
  };

  const formatTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Group by manga, keep only the latest read chapter per manga
  const grouped = Object.values(
    historyItems.reduce((acc, item) => {
      if (!acc[item.mangaId] || item.readAt > acc[item.mangaId].readAt) {
        acc[item.mangaId] = item;
      }
      return acc;
    }, {} as Record<number, HistoryItem>)
  ).sort((a, b) => b.readAt - a.readAt);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Info */}
      <div className="catalog-control-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 className="manga-detail-title" style={{ fontSize: '2rem', margin: 0 }}>
            {t('history.title')}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600, color: 'var(--muted-text)' }}>
            {t('history.subtitle')}
          </p>
        </div>
        {grouped.length > 0 && (
          <button
            className="comic-btn comic-btn-pink"
            onClick={handleClearAll}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Trash2 size={16} />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="loading-skeleton" style={{ width: '50px', height: '50px', borderRadius: '50%' }}></div>
        </div>
      ) : grouped.length === 0 ? (
        <div className="speech-bubble" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', textAlign: 'center' }}>
          <Clock size={48} style={{ color: 'var(--muted-text)', marginBottom: '1rem' }} />
          <h3 style={{ margin: 0, fontWeight: 900 }}>{t('history.title')}</h3>
          <p style={{ margin: '0.5rem 0 0 0', fontWeight: 600, color: 'var(--muted-text)' }}>
            {t('history.empty')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {grouped.map((item) => (
            <div
              key={item.mangaId}
              className="comic-box comic-box-interactive"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                gap: '1rem',
                cursor: 'pointer'
              }}
              onClick={() => onMangaSelect(item.mangaId)}
            >
              {/* Manga Cover */}
              <div style={{
                width: '60px',
                height: '80px',
                borderRadius: '6px',
                border: '2px solid var(--border-color)',
                backgroundColor: '#fff',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                <img
                  src={api.getMangaThumbnailUrl(item.mangaId)}
                  alt={item.mangaTitle}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.svg';
                  }}
                />
              </div>

              {/* History Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  margin: 0,
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {item.mangaTitle}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                  <span className="comic-sticker sticker-purple" style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem', transform: 'none', boxShadow: '1px 1px 0px var(--shadow-color)' }}>
                    {item.chapterName}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted-text)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={12} />
                    {formatTime(item.readAt)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {onChapterSelect && (
                  <button
                    className="comic-btn comic-btn-teal"
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChapterSelect(item.mangaId, item.chapterId);
                    }}
                    title="Continue Reading"
                  >
                    <BookOpen size={14} />
                    <span className="desktop-only-text" style={{ fontSize: '0.7rem' }}>{t('history.btn.resume')}</span>
                  </button>
                )}
                <button
                  className="comic-btn comic-btn-pink"
                  style={{ padding: '0.4rem', borderRadius: '50%', width: '32px', height: '32px', justifyContent: 'center' }}
                  onClick={(e) => handleDeleteItem(e, item.mangaId)}
                  title="Remove from history"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
