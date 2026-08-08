import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Search, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { trpc } from '@/api/trpc'
import MangaCard from '@/components/MangaCard'
import { useNavigate } from 'react-router-dom'

type TabType = 'popular' | 'latest' | 'search'

export default function SourceBrowsePage() {
  const { sourceId } = useParams<{ sourceId: string }>()
  const [tab, setTab] = useState<TabType>('popular')
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const { data: source } = trpc.source.byId.useQuery({ id: sourceId! })

  const popularQuery = trpc.source.popular.useQuery(
    { sourceId: sourceId!, page },
    { enabled: tab === 'popular' }
  )

  const latestQuery = trpc.source.latest.useQuery(
    { sourceId: sourceId!, page },
    { enabled: tab === 'latest' }
  )

  const searchResult = trpc.source.search.useQuery(
    { sourceId: sourceId!, query: searchQuery, page },
    { enabled: tab === 'search' && searchQuery.length > 0 }
  )

  const currentData = tab === 'popular' ? popularQuery : tab === 'latest' ? latestQuery : searchResult
  const mangas = currentData.data?.mangas ?? []
  const hasNextPage = currentData.data?.hasNextPage ?? false

  const addToLibrary = trpc.manga.fromSource.useMutation()

  const handleMangaClick = async (manga: any) => {
    const result = await addToLibrary.mutateAsync({
      sourceId: sourceId!,
      url: manga.url,
      title: manga.title,
      thumbnailUrl: manga.thumbnail_url,
    })
    navigate(`/manga/${result.id}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(query)
    setPage(1)
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/sources')}>
          <ArrowLeft size={20} />
        </button>
        {source?.iconUrl && (
          <img
            src={source.iconUrl}
            alt={source.name}
            style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }}
          />
        )}
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{source?.name || 'Loading...'}</h1>
          <p className="text-muted text-xs">{source?.lang?.toUpperCase()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-4" style={{ width: 'fit-content' }}>
        <button className={`tab${tab === 'popular' ? ' active' : ''}`} onClick={() => { setTab('popular'); setPage(1) }}>Popular</button>
        <button className={`tab${tab === 'latest' ? ' active' : ''}`} onClick={() => { setTab('latest'); setPage(1) }}>Latest</button>
        <button className={`tab${tab === 'search' ? ' active' : ''}`} onClick={() => setTab('search')}>Search</button>
      </div>

      {/* Search input */}
      {tab === 'search' && (
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="search-input-wrapper" style={{ flex: 1, maxWidth: 480 }}>
            <Search className="search-input-icon" size={16} />
            <input
              className="input search-input"
              placeholder={`Search in ${source?.name || 'source'}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      )}

      {/* Loading skeletons */}
      {currentData.isLoading && (
        <div className="manga-grid">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 14 }} />
              <div className="skeleton mt-2" style={{ height: 12, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      )}

      {/* Manga grid */}
      {!currentData.isLoading && mangas.length > 0 && (
        <>
          <motion.div
            className="manga-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {mangas.map((manga: any, i: number) => (
              <motion.div
                key={`${manga.url}-${i}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.025, 0.4) }}
                onClick={() => handleMangaClick(manga)}
                style={{ cursor: 'pointer' }}
              >
                <MangaCard
                  id={0}
                  title={manga.title}
                  thumbnailUrl={manga.thumbnail_url}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              className="btn btn-secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span className="text-muted text-sm">Page {page}</span>
            <button
              className="btn btn-secondary"
              disabled={!hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}
