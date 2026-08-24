import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Manga, Chapter, HistoryItem } from '../services/api';
import { ArrowLeft, Heart, HeartOff, Eye, EyeOff, Play, Search, ArrowDownAZ } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');

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
      <button className="comic-btn comic-btn-white" style={{ marginBottom: '1rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={onBack}>
        <ArrowLeft size={16} />
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
          <div style={{ display: 'flex', gap: '0.5rem', width: '100%', flexWrap: 'nowrap' }}>
            {recentHistory ? (
              <button
                className="comic-btn comic-btn-teal"
                style={{ flex: 1, fontWeight: 900, padding: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                onClick={() => onChapterSelect(manga.id, recentHistory.chapterId)}
              >
                <Play size={16} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('detail.btn.resume')}</span>
              </button>
            ) : chapters.length > 0 ? (
              <button
                className="comic-btn comic-btn-yellow"
                style={{ flex: 1, fontWeight: 900, padding: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                onClick={() => {
                  const sorted = [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);
                  const startId = sorted[0]?.id;
                  if (startId) onChapterSelect(manga.id, startId);
                }}
              >
                <Play size={16} />
                <span>{t('detail.btn.start')}</span>
              </button>
            ) : null}

            <button
              className={`comic-btn ${inLibrary ? 'comic-btn-white' : 'comic-btn-pink'}`}
              style={{
                flex: 1,
                borderColor: inLibrary ? 'var(--retro-pink)' : 'var(--border-color)',
                color: inLibrary ? 'var(--retro-pink)' : '#fff',
                margin: 0,
                padding: '0.5rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem'
              }}
              onClick={toggleLibraryStatus}
              disabled={updatingLibrary}
            >
              {inLibrary ? <HeartOff size={16} /> : <Heart size={16} />}
              <span style={{ whiteSpace: 'nowrap' }}>{inLibrary ? t('detail.btn.in_library') : t('detail.btn.add_library')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chapters list box */}
      <div className="comic-box" style={{ transform: 'rotate(0.5deg)', backgroundColor: 'var(--bg-card)' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          borderBottom: '3px solid var(--border-color)',
          paddingBottom: '1rem',
          marginBottom: '1rem'
        }}>
          {/* Top row: Progress count and Sort button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
              {t('detail.episodes_count')
                .replace('{read}', chapters.filter(c => c.read).length.toString())
                .replace('{total}', chapters.length.toString())}
            </h2>

            <button
              onClick={() => setSortOrder(prev => prev === 'latest' ? 'older' : 'latest')}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
                border: '2px solid var(--border-color)',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.1s ease',
                boxShadow: 'none'
              }}
            >
              <ArrowDownAZ size={14} />
              <span>{sortOrder === 'latest' ? t('detail.sort.latest') : t('detail.sort.older')}</span>
            </button>
          </div>

          {/* Bottom row: Full-width search bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', color: 'var(--muted-text)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder={t('detail.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem 0.45rem 2.25rem',
                border: '2px solid var(--border-color)',
                borderRadius: '20px',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
                fontWeight: 700,
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
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
              .filter(chapter => 
                chapter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                chapter.chapterNumber.toString().includes(searchQuery)
              )
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
