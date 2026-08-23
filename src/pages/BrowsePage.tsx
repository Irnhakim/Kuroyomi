import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Extension, Source, Manga } from '../services/api';
import { Compass, Cpu, Plus, Trash2, Search, ArrowLeft, ArrowRight, Sliders, Globe } from 'lucide-react';
import { useTranslation } from '../services/i18n';

// Global Search Result Row Component
interface GlobalSearchResultRowProps {
  source: Source;
  query: string;
  onMangaSelect: (mangaId: number) => void;
  onExplore: (source: Source) => void;
}

const GlobalSearchResultRow: React.FC<GlobalSearchResultRowProps> = ({ source, query, onMangaSelect, onExplore }) => {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api.searchSource(source.id, query, 1)
      .then(result => {
        if (isMounted) {
          setMangas(result.mangas || []);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error(`Search failed for source ${source.name}:`, err);
          setError(err.message || String(err));
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [source.id, query]);

  if (loading) {
    return (
      <div className="comic-box" style={{ padding: '1rem', marginBottom: '1.5rem', opacity: 0.7 }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            display: 'inline-block',
            width: '14px',
            height: '14px',
            border: '2px solid var(--text-color)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Searching on {source.name}...
        </h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="comic-box" style={{ padding: '1rem', marginBottom: '1.5rem', borderColor: 'var(--retro-pink)' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--retro-pink)' }}>
          {source.name} - Error
        </h3>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>{error}</p>
      </div>
    );
  }

  if (mangas.length === 0) {
    return null;
  }

  return (
    <div className="comic-box" style={{ padding: '1.25rem', marginBottom: '1.5rem', backgroundColor: 'var(--bg-card)' }}>
      {/* Source Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Source Icon */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            border: '2px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#fff',
            overflow: 'hidden'
          }}>
            <img
              src={api.getSourceIconUrl(source)}
              alt={source.name}
              style={{ width: '80%', height: '80%', objectFit: 'contain' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.svg';
              }}
            />
          </div>
          <div>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase' }}>{source.name}</h3>
            <span className="comic-sticker sticker-teal" style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem', marginTop: '0.2rem' }}>
              {source.lang.toUpperCase()}
            </span>
          </div>
        </div>

        <button
          className="comic-btn comic-btn-white"
          style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
          onClick={() => onExplore(source)}
        >
          Explore
        </button>
      </div>

      {/* Manga Results */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '1rem'
      }}>
        {mangas.slice(0, 6).map((manga, idx) => {
          const rotation = (idx % 3 === 0) ? '-1deg' : (idx % 3 === 1) ? '1deg' : '0deg';
          return (
            <div
              key={`${manga.id}-${idx}`}
              className="comic-box comic-box-interactive"
              style={{
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                transform: `rotate(${rotation})`,
                cursor: 'pointer'
              }}
              onClick={() => onMangaSelect(manga.id)}
            >
              <div style={{
                position: 'relative',
                width: '100%',
                paddingBottom: '140%',
                overflow: 'hidden',
                borderRadius: '4px',
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
                {manga.inLibrary && (
                  <div style={{ position: 'absolute', top: '4px', left: '4px', zIndex: 10 }}>
                    <span className="comic-sticker sticker-pink" style={{ fontSize: '0.5rem', padding: '0.1rem 0.25rem' }}>
                      IN LIB
                    </span>
                  </div>
                )}
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <h4 style={{
                  margin: 0,
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  lineHeight: 1.2,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  height: '2rem'
                }}>
                  {manga.title}
                </h4>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface BrowsePageProps {
  onMangaSelect: (mangaId: number) => void;
}

export const BrowsePage: React.FC<BrowsePageProps> = ({ onMangaSelect }) => {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<'sources' | 'extensions'>('sources');
  const [rawExtensions, setRawExtensions] = useState<Extension[]>([]);
  const [rawSources, setRawSources] = useState<Source[]>([]);
  const [allowedLanguages, setAllowedLanguages] = useState<string[]>([]);
  const [showLangModal, setShowLangModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Global search states
  const [globalSearchInput, setGlobalSearchInput] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Selection / Catalog browsing states
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [browseMode, setBrowseMode] = useState<'popular' | 'latest' | 'search'>('popular');
  const [catalogManga, setCatalogManga] = useState<Manga[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Source filters states
  const [filters, setFilters] = useState<any[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Extension search and filtering states
  const [extSearchQuery, setExtSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState('all');

  // Derived filtered extensions and sources based on allowed languages
  const extensions = rawExtensions.filter(ext => allowedLanguages.includes(ext.lang));
  const sources = rawSources.filter(source =>
    source.id === '0' ||
    source.name.toLowerCase() === 'local source' ||
    allowedLanguages.includes(source.lang)
  );

  const filteredExtensions = extensions.filter(ext => {
    const matchesSearch = ext.name.toLowerCase().includes(extSearchQuery.toLowerCase()) ||
                          ext.pkgName.toLowerCase().includes(extSearchQuery.toLowerCase());
    const matchesLang = selectedLang === 'all' || ext.lang === selectedLang;
    return matchesSearch && matchesLang;
  });

  const languages = ['all', ...Array.from(new Set(extensions.map(e => e.lang))).sort()];

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [exts, srcs, settings] = await Promise.all([
        api.getExtensions(),
        api.getSources(),
        api.getSettings()
      ]);
      setRawExtensions(exts);
      setRawSources(srcs);

      const allLangs = Array.from(new Set(exts.map(e => e.lang))).sort();
      let savedLangs: string[] = [];
      if (settings.allowedLanguages) {
        try {
          savedLangs = JSON.parse(settings.allowedLanguages);
        } catch (_) {}
      }

      if (!savedLangs || savedLangs.length === 0) {
        savedLangs = allLangs;
      }
      setAllowedLanguages(savedLangs);
    } catch (e) {
      console.error("Failed to fetch browse data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleToggleLanguage = (langCode: string) => {
    setAllowedLanguages(prev => {
      let next;
      if (prev.includes(langCode)) {
        if (prev.length <= 1) return prev;
        next = prev.filter(l => l !== langCode);
      } else {
        next = [...prev, langCode];
      }
      api.updateSettings({ allowedLanguages: JSON.stringify(next) }).catch(console.error);
      return next;
    });
  };

  const handleSelectAllLanguages = () => {
    const allLangs = Array.from(new Set(rawExtensions.map(e => e.lang))).sort();
    setAllowedLanguages(allLangs);
    api.updateSettings({ allowedLanguages: JSON.stringify(allLangs) }).catch(console.error);
  };

  const handleDeselectAllLanguages = () => {
    const appLang = localStorage.getItem('lang') || 'en';
    const defaultLang = allowedLanguages.includes(appLang) ? [appLang] : [allowedLanguages[0] || 'en'];
    setAllowedLanguages(defaultLang);
    api.updateSettings({ allowedLanguages: JSON.stringify(defaultLang) }).catch(console.error);
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearchInput.trim()) {
      setGlobalSearchQuery(globalSearchInput.trim());
    }
  };

  const handleExploreSourceWithQuery = (source: Source, query: string) => {
    setGlobalSearchQuery('');
    setGlobalSearchInput('');
    setBrowseMode('search');
    setSearchQuery(query);
    setSelectedSource(source);
  };

  // Compile filters state to Suwayomi API format
  const compileFiltersPayload = () => {
    const payload: any[] = [];
    filters.forEach((f, idx) => {
      if (f.type === 'CheckBox') {
        payload.push({ position: idx, state: String(f.filter.state) });
      } else if (f.type === 'Select' || f.type === 'TriState') {
        payload.push({ position: idx, state: String(f.filter.state) });
      } else if (f.type === 'Text') {
        payload.push({ position: idx, state: f.filter.state || '' });
      } else if (f.type === 'Sort') {
        payload.push({ position: idx, state: JSON.stringify(f.filter.state) });
      } else if (f.type === 'Group') {
        if (Array.isArray(f.filter.state)) {
          f.filter.state.forEach((child: any, childIdx: number) => {
            const childStateStr = String(child.filter.state);
            payload.push({
              position: idx,
              state: JSON.stringify({
                position: childIdx,
                state: childStateStr
              })
            });
          });
        }
      }
    });
    return payload;
  };

  const updateFilterValue = (index: number, newValue: any) => {
    setFilters(prev => prev.map((f, i) => {
      if (i !== index) return f;
      return {
        ...f,
        filter: {
          ...f.filter,
          state: newValue
        }
      };
    }));
  };

  const updateGroupChildValue = (groupIndex: number, childIndex: number, newValue: any) => {
    setFilters(prev => prev.map((f, i) => {
      if (i !== groupIndex) return f;
      const newGroupState = f.filter.state.map((child: any, cIdx: number) => {
        if (cIdx !== childIndex) return child;
        return {
          ...child,
          filter: {
            ...child.filter,
            state: newValue
          }
        };
      });
      return {
        ...f,
        filter: {
          ...f.filter,
          state: newGroupState
        }
      };
    }));
  };

  // Browse manga from a specific source
  const loadSourceCatalog = async (page = 1, append = false) => {
    if (!selectedSource) return;
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      let result;
      if (browseMode === 'popular') {
        result = await api.getSourcePopular(selectedSource.id, page);
      } else if (browseMode === 'latest') {
        result = await api.getSourceLatest(selectedSource.id, page);
      } else {
        const activeFilters = compileFiltersPayload();
        result = await api.searchSourceWithFilters(selectedSource.id, searchQuery, page, activeFilters);
      }

      if (append) {
        setCatalogManga(prev => [...prev, ...result.mangas]);
      } else {
        setCatalogManga(result.mangas);
      }
      setHasNextPage(result.hasNextPage);
      setCurrentPage(page);
    } catch (err: any) {
      console.error(err);
      setCatalogError(err.message || String(err));
      setCatalogManga([]);
    } finally {
      setCatalogLoading(false);
    }
  };

  const loadFilters = async (sourceId: string, reset = false) => {
    try {
      const data = await api.getSourceFilters(sourceId, reset);
      setFilters(data);
    } catch (e) {
      console.error("Failed to load source filters:", e);
      setFilters([]);
    }
  };

  useEffect(() => {
    if (selectedSource) {
      loadFilters(selectedSource.id, false);
      setShowFilterPanel(false);
      loadSourceCatalog(1, false);
    }
  }, [selectedSource]);

  useEffect(() => {
    if (selectedSource && (browseMode === 'popular' || browseMode === 'latest')) {
      loadSourceCatalog(1, false);
    }
  }, [browseMode]);

  const handleInstallExtension = async (pkgName: string) => {
    try {
      await api.installExtension(pkgName);
      loadInitialData(); // reload
    } catch (e) {
      console.error("Failed to install extension", e);
    }
  };

  const handleUninstallExtension = async (pkgName: string) => {
    if (confirm("Uninstall this extension?")) {
      try {
        await api.uninstallExtension(pkgName);
        loadInitialData(); // reload
      } catch (e) {
        console.error("Failed to uninstall extension", e);
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setBrowseMode('search');
      loadSourceCatalog(1, false);
    }
  };

  // If a source is selected, display the catalog browser page
  if (selectedSource) {
    return (
      <div>
        {/* Breadcrumbs / Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button className="comic-btn comic-btn-white" onClick={() => setSelectedSource(null)}>
            <ArrowLeft size={18} />
            Back to Sources
          </button>
          <div>
            <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>
              {selectedSource.name}
            </h1>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span className="comic-sticker sticker-teal">{selectedSource.lang.toUpperCase()}</span>
              <span className="comic-sticker sticker-yellow">Online</span>
            </div>
          </div>
        </div>

        {/* Catalog Control Bar */}
        <div className="catalog-control-bar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Mode Toggles */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`comic-btn ${browseMode === 'popular' ? 'comic-btn-pink' : 'comic-btn-white'}`}
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
              onClick={() => { setSearchQuery(''); setBrowseMode('popular'); }}
            >
              Popular
            </button>
            {selectedSource.supportsLatest && (
              <button
                className={`comic-btn ${browseMode === 'latest' ? 'comic-btn-pink' : 'comic-btn-white'}`}
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                onClick={() => { setSearchQuery(''); setBrowseMode('latest'); }}
              >
                Latest
              </button>
            )}
          </div>

          {/* Catalog Search Input and Filter Button */}
          <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
            <form onSubmit={handleSearchSubmit} className="catalog-search-form" style={{ flex: 1, margin: 0 }}>
              <input
                type="text"
                placeholder="Search source catalog..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-color)',
                  outline: 'none',
                  fontWeight: 600,
                  width: '100%',
                  fontFamily: 'inherit'
                }}
              />
              <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
                <Search size={18} color="var(--text-color)" />
              </button>
            </form>

            {filters.length > 0 && (
              <button
                className={`comic-btn ${showFilterPanel ? 'comic-btn-yellow' : 'comic-btn-white'}`}
                style={{ padding: '0.5rem 0.75rem' }}
                onClick={() => setShowFilterPanel(prev => !prev)}
                title="Toggle Filters"
              >
                <Sliders size={18} />
                <span className="desktop-only-text" style={{ fontSize: '0.85rem', marginLeft: '0.25rem' }}>Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilterPanel && filters.length > 0 && (
          <div className="comic-box" style={{ padding: '1.5rem', marginBottom: '2rem', backgroundColor: 'var(--bg-card)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontWeight: 900, textTransform: 'uppercase', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={20} />
              Search Filters
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {filters.map((f, idx) => {
                // Render filter inputs based on their type
                if (f.type === 'CheckBox') {
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        id={`filter-${idx}`}
                        checked={!!f.filter.state}
                        onChange={(e) => updateFilterValue(idx, e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label htmlFor={`filter-${idx}`} style={{ fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                        {f.name}
                      </label>
                    </div>
                  );
                }

                if (f.type === 'Select') {
                  const values = f.filter.values || [];
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--muted-text)' }}>{f.name}</label>
                      <select
                        value={f.filter.state}
                        onChange={(e) => updateFilterValue(idx, Number(e.target.value))}
                        className="comic-btn"
                        style={{ padding: '0.4rem', fontSize: '0.85rem', width: '100%', textAlign: 'left', borderRadius: '4px', textTransform: 'none' }}
                      >
                        {values.map((v: string, vIdx: number) => (
                          <option key={vIdx} value={vIdx}>{v}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (f.type === 'TriState') {
                  // state: 0 = IGNORE, 1 = INCLUDE, 2 = EXCLUDE
                  const stateVal = f.filter.state;
                  let colorClass = 'comic-btn-white';
                  let labelSuffix = ' (Ignore)';
                  if (stateVal === 1) {
                    colorClass = 'comic-btn-teal';
                    labelSuffix = ' (Include)';
                  } else if (stateVal === 2) {
                    colorClass = 'comic-btn-pink';
                    labelSuffix = ' (Exclude)';
                  }

                  const cycleTriState = () => {
                    const next = (stateVal + 1) % 3;
                    updateFilterValue(idx, next);
                  };

                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--muted-text)' }}>{f.name}</label>
                      <button
                        type="button"
                        className={`comic-btn ${colorClass}`}
                        style={{ padding: '0.4rem', fontSize: '0.85rem', width: '100%', textTransform: 'none', justifyContent: 'center' }}
                        onClick={cycleTriState}
                      >
                        {f.name}{labelSuffix}
                      </button>
                    </div>
                  );
                }

                if (f.type === 'Text') {
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--muted-text)' }}>{f.name}</label>
                      <input
                        type="text"
                        value={f.filter.state || ''}
                        onChange={(e) => updateFilterValue(idx, e.target.value)}
                        placeholder={`Enter ${f.name.toLowerCase()}...`}
                        style={{
                          padding: '0.4rem 0.6rem',
                          fontSize: '0.85rem',
                          border: '2px solid var(--border-color)',
                          borderRadius: '4px',
                          outline: 'none',
                          fontWeight: 600,
                          backgroundColor: 'var(--bg-body)',
                          color: 'var(--text-color)'
                        }}
                      />
                    </div>
                  );
                }

                if (f.type === 'Sort') {
                  // state: { selection: number, ascending: boolean }
                  const stateVal = f.filter.state || { selection: 0, ascending: false };
                  const values = f.filter.values || [];
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--muted-text)' }}>{f.name}</label>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <select
                          value={stateVal.selection}
                          onChange={(e) => updateFilterValue(idx, { ...stateVal, selection: Number(e.target.value) })}
                          className="comic-btn"
                          style={{ padding: '0.4rem', fontSize: '0.85rem', flex: 1, textTransform: 'none', borderRadius: '4px' }}
                        >
                          {values.map((v: string, vIdx: number) => (
                            <option key={vIdx} value={vIdx}>{v}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="comic-btn comic-btn-white"
                          style={{ padding: '0.4rem 0.6rem' }}
                          onClick={() => updateFilterValue(idx, { ...stateVal, ascending: !stateVal.ascending })}
                        >
                          {stateVal.ascending ? '▲' : '▼'}
                        </button>
                      </div>
                    </div>
                  );
                }

                if (f.type === 'Group') {
                  // Group represents nesting. state: array of child filters
                  const children = f.filter.state || [];
                  return (
                    <div key={idx} style={{ gridColumn: '1 / -1', border: '2px solid var(--border-color)', padding: '0.75rem', borderRadius: '6px', backgroundColor: 'var(--bg-body)' }}>
                      <span style={{ fontWeight: 900, fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        {f.name}
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                        {children.map((child: any, cIdx: number) => {
                          const childId = `filter-${idx}-${cIdx}`;
                          // Group children are usually TriState or Checkbox in Suwayomi
                          // Let's handle TriState and Checkbox
                          if (child.type === 'TriState') {
                            const cState = child.filter.state;
                            let cColor = 'comic-btn-white';
                            let cLabel = 'Ignore';
                            if (cState === 1) {
                              cColor = 'comic-btn-teal';
                              cLabel = 'Include';
                            } else if (cState === 2) {
                              cColor = 'comic-btn-pink';
                              cLabel = 'Exclude';
                            }
                            return (
                              <button
                                key={cIdx}
                                type="button"
                                className={`comic-btn ${cColor}`}
                                style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', textTransform: 'none', justifyContent: 'center' }}
                                onClick={() => {
                                  const next = (cState + 1) % 3;
                                  updateGroupChildValue(idx, cIdx, next);
                                }}
                              >
                                {child.name}: {cLabel}
                              </button>
                            );
                          }
                          // Fallback to Checkbox
                          return (
                            <div key={cIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <input
                                type="checkbox"
                                id={childId}
                                checked={!!child.filter.state}
                                onChange={(e) => updateGroupChildValue(idx, cIdx, e.target.checked)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                              />
                              <label htmlFor={childId} style={{ fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                                {child.name}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="comic-btn comic-btn-white"
                onClick={() => loadFilters(selectedSource.id, true)}
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
              >
                Reset Filters
              </button>
              <button
                type="button"
                className="comic-btn comic-btn-teal"
                onClick={() => {
                  setBrowseMode('search');
                  loadSourceCatalog(1, false);
                }}
                style={{ padding: '0.4rem 1.5rem', fontSize: '0.85rem', fontWeight: 900 }}
              >
                Apply & Search
              </button>
            </div>
          </div>
        )}

        {/* Manga Catalog Grid */}
        {catalogLoading && catalogManga.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="comic-box" style={{ display: 'inline-block', backgroundColor: 'var(--retro-yellow)' }}>
              <h3 style={{ margin: 0, fontWeight: 900 }}>CATALOGING SOURCE...</h3>
            </div>
          </div>
        ) : catalogError ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="speech-bubble" style={{ display: 'inline-block', borderColor: 'var(--retro-pink)' }}>
              <h3 style={{ margin: 0, fontWeight: 900, color: 'var(--retro-pink)' }}>ERROR LOADING CATALOG</h3>
              <p style={{ margin: '0.5rem 0 0 0', fontWeight: 600 }}>{catalogError}</p>
            </div>
          </div>
        ) : catalogManga.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="speech-bubble" style={{ display: 'inline-block' }}>
              <h3 style={{ margin: 0, fontWeight: 900 }}>NO RESULTS FOUND</h3>
              <p style={{ margin: '0.5rem 0 0 0', fontWeight: 500 }}>No comics available in this listing.</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="comic-grid">
              {catalogManga.map((manga, idx) => {
                const rotation = (idx % 3 === 0) ? '-1deg' : (idx % 3 === 1) ? '1deg' : '0deg';
                return (
                  <div
                    key={`${manga.id}-${idx}`}
                    className="comic-box comic-box-interactive"
                    style={{
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      transform: `rotate(${rotation})`,
                      height: '100%'
                    }}
                    onClick={() => onMangaSelect(manga.id)}
                  >
                    {/* Cover */}
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
                      {manga.inLibrary && (
                        <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10 }}>
                          <span className="comic-sticker sticker-pink" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem' }}>
                            IN LIB
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <div style={{ marginTop: '1rem', flex: 1 }}>
                      <h3 style={{
                        margin: 0,
                        fontWeight: 900,
                        fontSize: '1rem',
                        lineHeight: 1.2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '2.4rem'
                      }}>
                        {manga.title}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '3rem', alignItems: 'center' }}>
              <button
                className="comic-btn comic-btn-white"
                disabled={currentPage <= 1 || catalogLoading}
                onClick={() => loadSourceCatalog(currentPage - 1)}
              >
                <ArrowLeft size={18} />
                Previous
              </button>
              
              <span className="comic-sticker sticker-yellow" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                PAGE {currentPage}
              </span>

              <button
                className="comic-btn comic-btn-white"
                disabled={!hasNextPage || catalogLoading}
                onClick={() => loadSourceCatalog(currentPage + 1)}
              >
                Next
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Base list of sources & extensions
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-1px' }}>
          {t('browse.title')} <span style={{ background: 'var(--retro-teal)', color: '#1a1a1a', padding: '0 0.5rem', display: 'inline-block', transform: 'rotate(1.5deg)' }}>Catalogs</span>
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', fontWeight: 500, color: 'var(--muted-text)' }}>
          {t('browse.subtitle')}
        </p>
      </div>

      {/* Sub tabs & Language Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '3px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className={`nav-tab ${activeSubTab === 'sources' ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => { setActiveSubTab('sources'); setGlobalSearchQuery(''); setGlobalSearchInput(''); }}
          >
            <Compass size={18} />
            {t('browse.sources')} ({sources.length})
          </button>
          <button
            className={`nav-tab ${activeSubTab === 'extensions' ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => { setActiveSubTab('extensions'); setGlobalSearchQuery(''); setGlobalSearchInput(''); }}
          >
            <Cpu size={18} />
            {t('browse.extensions')} ({extensions.length})
          </button>
        </div>

        <button
          className="comic-btn comic-btn-yellow"
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
          onClick={() => setShowLangModal(true)}
        >
          <Globe size={16} />
          <span>Languages ({allowedLanguages.length})</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="comic-box" style={{ display: 'inline-block', backgroundColor: 'var(--retro-yellow)' }}>
            <h3 style={{ margin: 0, fontWeight: 900 }}>CONNECTING TO BACKEND...</h3>
          </div>
        </div>
      ) : globalSearchQuery ? (
        /* GLOBAL SEARCH VIEW */
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <button className="comic-btn comic-btn-white" onClick={() => { setGlobalSearchQuery(''); setGlobalSearchInput(''); }}>
              <ArrowLeft size={18} />
              Back to Sources
            </button>
            <div>
              <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>
                Global Search
              </h1>
              <p style={{ margin: '0.25rem 0 0 0', fontWeight: 600, color: 'var(--muted-text)' }}>
                Results for "{globalSearchQuery}"
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sources.filter(s => s.id !== '0' && s.name.toLowerCase() !== 'local source').length === 0 ? (
              <div className="speech-bubble">
                <h3 style={{ margin: 0 }}>No active sources for global search</h3>
                <p style={{ margin: '0.5rem 0 0 0' }}>Make sure you have enabled some languages and installed extensions.</p>
              </div>
            ) : (
              sources.filter(s => s.id !== '0' && s.name.toLowerCase() !== 'local source').map(source => (
                <GlobalSearchResultRow
                  key={source.id}
                  source={source}
                  query={globalSearchQuery}
                  onMangaSelect={onMangaSelect}
                  onExplore={(src) => handleExploreSourceWithQuery(src, globalSearchQuery)}
                />
              ))
            )}
          </div>
        </div>
      ) : activeSubTab === 'sources' ? (
        /* SOURCES VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Global Search Bar */}
          <form onSubmit={handleGlobalSearchSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', width: '100%' }}>
            <div className="search-bar-wrap" style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: '100%', margin: 0 }}>
              <Search size={18} style={{ marginRight: '0.5rem', color: 'var(--muted-text)' }} />
              <input
                type="text"
                placeholder="Search manga globally across all installed sources..."
                value={globalSearchInput}
                onChange={(e) => setGlobalSearchInput(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-color)',
                  outline: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  width: '100%',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <button type="submit" className="comic-btn comic-btn-teal" style={{ padding: '0.5rem 1.5rem' }}>
              Search
            </button>
          </form>

          {sources.length === 0 ? (
            <div className="speech-bubble">
              <h3 style={{ margin: 0 }}>No Sources Active</h3>
              <p style={{ margin: '0.5rem 0 0 0' }}>Install extension packages from the "Extensions" tab to activate sources.</p>
            </div>
          ) : (
            sources.map((source) => (
              <div
                key={source.id}
                className="comic-box comic-box-interactive source-card"
                onClick={() => setSelectedSource(source)}
              >
                <div className="source-info">
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '6px',
                    border: '2px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <img
                      src={api.getSourceIconUrl(source)}
                      alt={source.name}
                      style={{ width: '80%', height: '80%', objectFit: 'contain' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo.svg';
                      }}
                    />
                  </div>

                  <div className="source-title-wrap">
                    <h3 className="source-title">{source.name}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                      <span className="comic-sticker sticker-teal" style={{ fontSize: '0.6rem' }}>
                        {source.lang.toUpperCase()}
                      </span>
                      {source.supportsLatest && (
                        <span className="comic-sticker sticker-yellow" style={{ fontSize: '0.6rem' }}>
                          LATEST
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button className="comic-btn comic-btn-pink browse-explore-btn">
                  <Compass size={16} />
                  <span>Explore</span>
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        /* EXTENSIONS VIEW */
        <div>
          {/* Extension Search and Language Filters */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            backgroundColor: 'var(--bg-card)',
            border: '3px solid var(--border-color)',
            boxShadow: '4px 4px 0px var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '2rem'
          }}>
            {/* Search Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-color)',
              border: '2px solid var(--border-color)',
              borderRadius: '6px',
              padding: '0.5rem 0.75rem',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <Search size={18} style={{ marginRight: '0.5rem', color: 'var(--muted-text)' }} />
              <input
                type="text"
                placeholder={t('browse.search.manga')}
                value={extSearchQuery}
                onChange={(e) => setExtSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-color)',
                  outline: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  width: '100%',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Language filter pills */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              whiteSpace: 'nowrap'
            }}>
              {languages.map(lang => (
                <button
                  key={lang}
                  className="comic-btn"
                  style={{
                    padding: '0.3rem 0.8rem',
                    fontSize: '0.8rem',
                    backgroundColor: selectedLang === lang ? 'var(--retro-pink)' : 'var(--bg-color)',
                    color: selectedLang === lang ? '#fff' : 'var(--text-color)',
                    transform: 'none',
                    boxShadow: selectedLang === lang ? '2px 2px 0px var(--border-color)' : 'none',
                    border: '2px solid var(--border-color)'
                  }}
                  onClick={() => setSelectedLang(lang)}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {filteredExtensions.map((ext) => (
            <div
              key={ext.pkgName}
              className="comic-box extension-card"
            >
              {/* Icon */}
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '8px',
                border: '2px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'var(--bg-color)',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                <img
                  src={api.getExtensionIconUrl(ext.pkgName)}
                  alt={ext.name}
                  style={{ width: '80%', height: '80%', objectFit: 'contain' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.svg';
                  }}
                />
              </div>

              {/* Info */}
              <div className="extension-info">
                <h3 className="extension-title-wrap">
                  <span className="extension-title" title={ext.name}>{ext.name}</span>
                  <span className="comic-sticker sticker-teal" style={{ fontSize: '0.6rem' }}>
                    {ext.lang.toUpperCase()}
                  </span>
                  {ext.isNsfw && (
                    <span className="comic-sticker sticker-pink" style={{ fontSize: '0.6rem' }}>
                      18+
                    </span>
                  )}
                </h3>
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: 'var(--muted-text)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  v{ext.versionName} • {ext.pkgName.split('.').pop()}
                </p>
              </div>

              {/* Install / Uninstall Button */}
              <div>
                {ext.status === 'INSTALLED' ? (
                  <button
                    className="comic-btn comic-btn-white ext-action-btn"
                    style={{ borderColor: 'var(--retro-pink)', color: 'var(--retro-pink)' }}
                    onClick={() => handleUninstallExtension(ext.pkgName)}
                  >
                    <Trash2 size={16} />
                    <span>{t('browse.btn.uninstall')}</span>
                  </button>
                ) : (
                  <button
                    className="comic-btn comic-btn-yellow ext-action-btn"
                    onClick={() => handleInstallExtension(ext.pkgName)}
                  >
                    <Plus size={16} />
                    <span>{t('browse.btn.install')}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Allowed Languages Modal */}
      {showLangModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setShowLangModal(false)}>
          <div className="comic-box" style={{
            maxWidth: '500px',
            width: '100%',
            backgroundColor: 'var(--bg-card)',
            padding: '2rem',
            transform: 'rotate(-0.5deg)'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, textTransform: 'uppercase', fontSize: '1.75rem' }}>
              Allowed Languages
            </h2>
            <p style={{ margin: '0 0 1.5rem 0', fontWeight: 700, color: 'var(--muted-text)' }}>
              Select which languages to show for sources and extensions.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button className="comic-btn comic-btn-white" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', flex: 1 }} onClick={handleSelectAllLanguages}>
                Select All
              </button>
              <button className="comic-btn comic-btn-white" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', flex: 1 }} onClick={handleDeselectAllLanguages}>
                Reset
              </button>
            </div>

            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              border: '2px solid var(--border-color)',
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-color)',
              marginBottom: '2rem'
            }}>
              {Array.from(new Set(rawExtensions.map(e => e.lang))).sort().map(langCode => {
                const isChecked = allowedLanguages.includes(langCode);
                return (
                  <div key={langCode} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id={`lang-checkbox-${langCode}`}
                      checked={isChecked}
                      onChange={() => handleToggleLanguage(langCode)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label
                      htmlFor={`lang-checkbox-${langCode}`}
                      style={{ fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', textTransform: 'uppercase' }}
                    >
                      {langCode}
                    </label>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="comic-btn comic-btn-pink" style={{ padding: '0.5rem 1.5rem' }} onClick={() => setShowLangModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
