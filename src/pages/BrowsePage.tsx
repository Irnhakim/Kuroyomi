import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Extension, Source, Manga } from '../services/api';
import { Compass, Cpu, Plus, Trash2, Search, ArrowLeft, ArrowRight } from 'lucide-react';

interface BrowsePageProps {
  onMangaSelect: (mangaId: number) => void;
}

export const BrowsePage: React.FC<BrowsePageProps> = ({ onMangaSelect }) => {
  const [activeSubTab, setActiveSubTab] = useState<'sources' | 'extensions'>('sources');
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection / Catalog browsing states
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [browseMode, setBrowseMode] = useState<'popular' | 'latest' | 'search'>('popular');
  const [catalogManga, setCatalogManga] = useState<Manga[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Extension search and filtering states
  const [extSearchQuery, setExtSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState('all');

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
      const [exts, srcs] = await Promise.all([
        api.getExtensions(),
        api.getSources()
      ]);
      setExtensions(exts);
      setSources(srcs);
    } catch (e) {
      console.error("Failed to fetch browse data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

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
        result = await api.searchSource(selectedSource.id, searchQuery, page);
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

  useEffect(() => {
    if (selectedSource) {
      loadSourceCatalog(1, false);
    }
  }, [selectedSource, browseMode]);

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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--bg-card)',
          border: '3px solid var(--border-color)',
          boxShadow: '4px 4px 0px var(--border-color)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
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

          {/* Catalog Search Input */}
          <form onSubmit={handleSearchSubmit} style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-color)',
            border: '2px solid var(--border-color)',
            borderRadius: '6px',
            padding: '0.25rem 0.5rem',
            width: '100%',
            maxWidth: '350px'
          }}>
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
        </div>

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
          Browse <span style={{ background: 'var(--retro-teal)', color: '#1a1a1a', padding: '0 0.5rem', display: 'inline-block', transform: 'rotate(1.5deg)' }}>Catalogs</span>
        </h1>
        <p style={{ margin: '0.5rem 0 0 0', fontWeight: 500, color: 'var(--muted-text)' }}>
          Discover new series from online manga sources.
        </p>
      </div>

      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '3px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          className={`nav-tab ${activeSubTab === 'sources' ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={() => setActiveSubTab('sources')}
        >
          <Compass size={18} />
          Sources ({sources.length})
        </button>
        <button
          className={`nav-tab ${activeSubTab === 'extensions' ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={() => setActiveSubTab('extensions')}
        >
          <Cpu size={18} />
          Extensions ({extensions.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div className="comic-box" style={{ display: 'inline-block', backgroundColor: 'var(--retro-yellow)' }}>
            <h3 style={{ margin: 0, fontWeight: 900 }}>CONNECTING TO BACKEND...</h3>
          </div>
        </div>
      ) : activeSubTab === 'sources' ? (
        /* SOURCES VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sources.length === 0 ? (
            <div className="speech-bubble">
              <h3 style={{ margin: 0 }}>No Sources Active</h3>
              <p style={{ margin: '0.5rem 0 0 0' }}>Install extension packages from the "Extensions" tab to activate sources.</p>
            </div>
          ) : (
            sources.map((source) => (
              <div
                key={source.id}
                className="comic-box comic-box-interactive"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem',
                  borderRadius: '8px'
                }}
                onClick={() => setSelectedSource(source)}
              >
                <div>
                  <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.3rem' }}>{source.name}</h3>
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
                
                <button className="comic-btn comic-btn-pink" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  Explore Catalog
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
                placeholder="Search extensions (e.g. mangadex)..."
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
              className="comic-box"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                padding: '1.25rem',
                borderRadius: '8px'
              }}
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
                overflow: 'hidden'
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
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {ext.name}
                  <span className="comic-sticker sticker-teal" style={{ fontSize: '0.6rem' }}>
                    {ext.lang.toUpperCase()}
                  </span>
                  {ext.isNsfw && (
                    <span className="comic-sticker sticker-pink" style={{ fontSize: '0.6rem' }}>
                      18+
                    </span>
                  )}
                </h3>
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: 'var(--muted-text)', fontWeight: 700 }}>
                  v{ext.versionName} • {ext.pkgName.split('.').pop()}
                </p>
              </div>

              {/* Install / Uninstall Button */}
              <div>
                {ext.status === 'INSTALLED' ? (
                  <button
                    className="comic-btn comic-btn-white"
                    style={{ borderColor: 'var(--retro-pink)', color: 'var(--retro-pink)', padding: '0.5rem 1rem' }}
                    onClick={() => handleUninstallExtension(ext.pkgName)}
                  >
                    <Trash2 size={16} />
                    Uninstall
                  </button>
                ) : (
                  <button
                    className="comic-btn comic-btn-yellow"
                    style={{ padding: '0.5rem 1rem' }}
                    onClick={() => handleInstallExtension(ext.pkgName)}
                  >
                    <Plus size={16} />
                    Install
                  </button>
                )}
              </div>
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
};
