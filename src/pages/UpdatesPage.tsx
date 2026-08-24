import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { ChapterUpdate } from '../services/api';
import { RefreshCw, BookOpen } from 'lucide-react';
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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
  const getGroupTitle = (fetchedAtVal: any) => {
    let itemDate = new Date();
    
    if (typeof fetchedAtVal === 'number') {
      if (fetchedAtVal < 99999999999) {
        itemDate = new Date(fetchedAtVal * 1000);
      } else {
        itemDate = new Date(fetchedAtVal);
      }
    } else if (fetchedAtVal) {
      const parsed = new Date(fetchedAtVal);
      if (!isNaN(parsed.getTime())) {
        itemDate = parsed;
      } else {
        const num = Number(fetchedAtVal);
        if (!isNaN(num)) {
          if (num < 99999999999) {
            itemDate = new Date(num * 1000);
          } else {
            itemDate = new Date(num);
          }
        }
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const compareDate = new Date(itemDate);
    compareDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - compareDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t('updates.date.today');
    } else if (diffDays === 1) {
      return t('updates.date.yesterday');
    } else if (diffDays > 1 && diffDays < 7) {
      return t('updates.date.days_ago').replace('{count}', String(diffDays));
    } else {
      return itemDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px' }}>
            {t('updates.title_prefix')}{' '}
            <span style={{ background: 'var(--retro-teal)', color: '#1a1a1a', padding: '0 0.5rem', display: 'inline-block', transform: 'rotate(1.5deg)' }}>
              {t('updates.title_suffix')}
            </span>
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', fontWeight: 500, color: 'var(--muted-text)' }}>
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
          {Object.keys(groupedUpdates).map((dateKey) => {
            const rawList = groupedUpdates[dateKey];
            
            // Group by mangaId
            interface MangaGroup {
              mangaId: number;
              mangaTitle: string;
              mangaThumbnailUrl: string;
              sourceId: string;
              chapters: ChapterUpdate[];
            }
            
            const mangaGroups: MangaGroup[] = [];
            const map: { [mangaId: number]: MangaGroup } = {};

            rawList.forEach(item => {
              if (!map[item.mangaId]) {
                map[item.mangaId] = {
                  mangaId: item.mangaId,
                  mangaTitle: item.mangaTitle,
                  mangaThumbnailUrl: item.mangaThumbnailUrl,
                  sourceId: item.sourceId,
                  chapters: []
                };
                mangaGroups.push(map[item.mangaId]);
              }
              map[item.mangaId].chapters.push(item);
            });

            // Sort chapters in each group by chapterNumber descending so latest is first
            mangaGroups.forEach(g => {
              g.chapters.sort((a, b) => b.chapterNumber - a.chapterNumber);
            });

            return (
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
                  {mangaGroups.map((group) => {
                    const latestChapter = group.chapters[0];
                    const groupKey = `${dateKey}_${group.mangaId}`;
                    const isExpanded = !!expandedGroups[groupKey];

                    return (
                      <div key={group.mangaId} style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Main Manga Card */}
                        <div
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
                          onClick={() => onChapterSelect(group.mangaId, latestChapter.chapterId)}
                        >
                          {/* Cover Thumbnail */}
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              onMangaSelect(group.mangaId);
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
                              src={group.mangaThumbnailUrl}
                              alt={group.mangaTitle}
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
                                onMangaSelect(group.mangaId);
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
                              {group.mangaTitle}
                            </h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.2rem' }}>
                              <span 
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  color: latestChapter.isRead ? 'var(--muted-text)' : 'var(--text-color)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem'
                                }}
                              >
                                {!latestChapter.isRead && (
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
                                {latestChapter.chapterName}
                              </span>

                              {/* Show More/Less Button */}
                              {group.chapters.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedGroups(prev => ({
                                      ...prev,
                                      [groupKey]: !isExpanded
                                    }));
                                  }}
                                  style={{
                                    alignSelf: 'flex-start',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--retro-teal)',
                                    fontSize: '0.75rem',
                                    fontWeight: 900,
                                    padding: '0.15rem 0',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    marginTop: '0.25rem',
                                    letterSpacing: '0.02em',
                                    textAlign: 'left'
                                  }}
                                >
                                  {isExpanded
                                    ? `${t('updates.hide_chapters')} ∧`
                                    : `${t('updates.show_more').replace('{count}', String(group.chapters.length - 1))} ∨`
                                  }
                                </button>
                              )}
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

                        {/* Expanded chapters list */}
                        {isExpanded && group.chapters.length > 1 && (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.4rem',
                              marginTop: '0.4rem',
                              paddingLeft: '3.5rem',
                              borderLeft: '3px dashed var(--retro-teal)',
                              marginLeft: '1.5rem',
                              paddingBottom: '0.4rem'
                            }}
                          >
                            {group.chapters.slice(1).map((ch) => (
                              <div
                                key={ch.chapterId}
                                onClick={() => onChapterSelect(group.mangaId, ch.chapterId)}
                                className="comic-box"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0.5rem 0.8rem',
                                  backgroundColor: 'var(--bg-card)',
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  opacity: 0.9
                                }}
                              >
                                <span style={{ color: ch.isRead ? 'var(--muted-text)' : 'var(--text-color)' }}>
                                  {!ch.isRead && (
                                    <span style={{
                                      display: 'inline-block',
                                      width: '6px',
                                      height: '6px',
                                      borderRadius: '50%',
                                      backgroundColor: 'var(--retro-teal)',
                                      marginRight: '0.4rem'
                                    }}/>
                                  )}
                                  {ch.chapterName}
                                </span>
                                <BookOpen size={14} style={{ opacity: 0.7 }} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
