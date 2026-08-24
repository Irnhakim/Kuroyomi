import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Manga, Chapter, HistoryItem } from '../services/api';
import { ArrowLeft, Heart, HeartOff, Eye, EyeOff, Play } from 'lucide-react';
import { useTranslation } from '../services/i18n';

interface MangaDetailPageProps {
  mangaId: number;
  onBack: () => void;
  onChapterSelect: (mangaId: number, chapterIndex: number) => void;
}

export const MangaDetailPage: React.FC<MangaDetailPageProps> = ({
  mangaId,
  onBack,
  onChapterSelect,
}) => {
  const { t } = useTranslation();
  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inLibrary, setInLibrary] = useState(false);
  const [updatingLibrary, setUpdatingLibrary] = useState(false);
  const [recentHistory, setRecentHistory] = useState<HistoryItem | null>(null);
  const [sortOrder, setSortOrder] = useState<'latest' | 'older'>('latest');

  const loadMangaDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch full initialized manga details
      const details = await api.getMangaDetailsFull(mangaId);
      setManga(details);
      setInLibrary(details.inLibrary);

      // Fetch chapters list
      const chapterList = await api.getMangaChapters(mangaId);
      // Sort chapters by source order (usually higher is newer or reverse, we can keep the raw API order or sort them)
      setChapters(chapterList);

      // Fetch history for this manga
      const historyList = await api.getHistory();
      const matchedHistory = historyList.find(h => h.mangaId === mangaId);
      setRecentHistory(matchedHistory || null);
    } catch (err) {
      console.error(err);
      setError('Failed to load manga details. Please verify Suwayomi-Server status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMangaDetails();
  }, [mangaId]);

  const toggleLibraryStatus = async () => {
    if (!manga) return;
    setUpdatingLibrary(true);
    try {
      if (inLibrary) {
        await api.removeFromLibrary(mangaId);
        setInLibrary(false);
      } else {
        await api.addToLibrary(mangaId);
        setInLibrary(true);
      }
    } catch (e) {
      console.error("Failed to update library status", e);
    } finally {
      setUpdatingLibrary(false);
    }
  };

  const toggleChapterRead = async (e: React.MouseEvent, chapterId: number, currentRead: boolean) => {
    e.stopPropagation(); // prevent opening the reader when clicking the eye button
    try {
      await api.markChapterRead(mangaId, chapterId, !currentRead);
      // Update local state
      setChapters(prev => prev.map((ch) => {
        if (ch.id === chapterId) {
          return { ...ch, read: !currentRead };
        }
        return ch;
      }));
    } catch (err) {
      console.error("Failed to mark chapter", err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <div className="comic-box" style={{ display: 'inline-block', backgroundColor: 'var(--retro-yellow)' }}>
          <h3 style={{ margin: 0, fontWeight: 900 }}>{t('detail.state.loading')}</h3>
        </div>
      </div>
    );
  }

  if (error || !manga) {
    return (
      <div className="comic-box" style={{ backgroundColor: 'var(--retro-pink)', color: '#fff' }}>
        <h3 style={{ margin: 0, fontWeight: 900 }}>ERROR RETRIEVING DATA</h3>
        <p style={{ margin: '0.5rem 0 0 0', fontWeight: 600 }}>{error || 'Manga details not found.'}</p>
        <button className="comic-btn comic-btn-white" style={{ marginTop: '1rem' }} onClick={onBack}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <button className="comic-btn comic-btn-white" style={{ marginBottom: '2rem' }} onClick={onBack}>
        <ArrowLeft size={18} />
        Back
      </button>

      {/* Comic Book Header Info */}
      <div className="manga-detail-header" style={{
        display: 'flex',
        gap: '2.5rem',
        flexWrap: 'wrap',
        marginBottom: '3rem',
        alignItems: 'flex-start'
      }}>
        {/* Cover Art Box */}
        <div className="comic-box manga-detail-cover" style={{
          padding: '0.75rem',
          transform: 'rotate(-1.5deg)',
          maxWidth: '300px',
          width: '100%',
          flexShrink: 0
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            paddingBottom: '140%',
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
          </div>
        </div>

        {/* Title, tags and Description */}
        <div className="manga-detail-info">
          <h1 className="manga-detail-title">
            {manga.title}
          </h1>

          <p className="manga-detail-creator">
            by {manga.author || manga.artist || 'Unknown Creator'}
          </p>

          {/* Badges */}
          <div className="manga-detail-badges-wrap">
            <span className="comic-sticker sticker-yellow">{manga.status}</span>
            {manga.genre?.slice(0, 5).map((g, idx) => (
              <span key={idx} className="comic-sticker sticker-teal" style={{ transform: `rotate(${(idx % 2 === 0 ? 1 : -1) * 1.5}deg)` }}>
                {g}
              </span>
            ))}
          </div>

          {/* Description speech bubble */}
          <div className="comic-box manga-detail-synopsis" style={{ backgroundColor: 'var(--bg-card)' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, fontSize: '1.1rem', textTransform: 'uppercase' }}>
              Synopsis
            </h4>
            <p style={{ margin: 0, lineHeight: 1.5, fontWeight: 500, fontSize: '0.95rem' }}>
              {manga.description || 'No summary available for this title.'}
            </p>
          </div>

          {/* Library and Reading Actions */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {recentHistory ? (
              <button
                className="comic-btn comic-btn-teal"
                style={{ fontWeight: 900 }}
                onClick={() => onChapterSelect(manga.id, recentHistory.chapterId)}
              >
                <Play size={18} />
                {t('detail.btn.resume')} ({recentHistory.chapterName})
              </button>
            ) : chapters.length > 0 ? (
              <button
                className="comic-btn comic-btn-yellow"
                style={{ fontWeight: 900 }}
                onClick={() => {
                  const sorted = [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
                  const startId = sorted[0]?.id;
                  if (startId) onChapterSelect(manga.id, startId);
                }}
              >
                <Play size={18} />
                {t('detail.btn.start')}
              </button>
            ) : null}

            <button
              className={`comic-btn ${inLibrary ? 'comic-btn-white' : 'comic-btn-pink'} manga-detail-lib-btn`}
              style={{
                borderColor: inLibrary ? 'var(--retro-pink)' : 'var(--border-color)',
                color: inLibrary ? 'var(--retro-pink)' : '#fff',
                margin: 0
              }}
              onClick={toggleLibraryStatus}
              disabled={updatingLibrary}
            >
              {inLibrary ? <HeartOff size={18} /> : <Heart size={18} />}
              {inLibrary ? t('detail.btn.in_library') : t('detail.btn.add_library')}
            </button>
          </div>
        </div>
      </div>

      {/* Chapters list box */}
      <div className="comic-box" style={{ transform: 'rotate(0.5deg)', backgroundColor: 'var(--bg-card)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid var(--border-color)',
          paddingBottom: '1rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.8rem', textTransform: 'uppercase' }}>
            Chapters ({chapters.length})
          </h2>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'latest' | 'older')}
              style={{
                padding: '0.4rem 0.6rem',
                border: '2px solid var(--border-color)',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '2px 2px 0px var(--border-color)'
              }}
            >
              <option value="latest">{t('detail.sort.latest')}</option>
              <option value="older">{t('detail.sort.older')}</option>
            </select>
          </div>
        </div>

        {chapters.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem 0', fontWeight: 700 }}>
            No chapters loaded. Try syncing/fetching updates from Suwayomi.
          </p>
        ) : (
          <div className="manga-chapters-list" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            maxHeight: '600px',
            overflowY: 'auto',
            paddingRight: '0.5rem'
          }}>
            {[...chapters]
              .sort((a, b) => {
                if (sortOrder === 'latest') {
                  return b.sourceOrder - a.sourceOrder;
                } else {
                  return a.sourceOrder - b.sourceOrder;
                }
              })
              .map((chapter) => (
                <div
                  key={chapter.id}
                  onClick={() => onChapterSelect(manga.id, chapter.id)}
                  className="manga-chapter-row"
                  style={{
                    backgroundColor: chapter.read ? 'var(--bg-color)' : 'var(--bg-card)',
                    opacity: chapter.read ? 0.75 : 1
                  }}
                >
                  {/* Chapter Name & Number */}
                  <div className="manga-chapter-title-wrap">
                    <span className="comic-sticker sticker-purple manga-chapter-badge">
                      #{chapter.chapterNumber}
                    </span>
                    <span className="manga-chapter-name">
                      {chapter.name}
                    </span>
                  </div>

                  {/* Read Status Controls */}
                  <div className="manga-chapter-controls">
                    {chapter.dateUpload > 0 && (
                      <span className="manga-chapter-date">
                        {new Date(chapter.dateUpload).toLocaleDateString()}
                      </span>
                    )}
                    <button
                      onClick={(e) => toggleChapterRead(e, chapter.id, chapter.read)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: chapter.read ? 'var(--retro-teal)' : 'var(--muted-text)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.25rem'
                      }}
                      title={chapter.read ? 'Mark as Unread' : 'Mark as Read'}
                    >
                      {chapter.read ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
