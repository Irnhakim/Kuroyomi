import { useState } from 'react'
import { motion } from 'framer-motion'
import { LayoutGrid, List, SlidersHorizontal, BookOpen } from 'lucide-react'
import { trpc } from '@/api/trpc'
import MangaCard from '@/components/MangaCard'

type SortKey = 'title' | 'lastRead' | 'lastUpdated' | 'dateAdded' | 'unread'

export default function LibraryPage() {
  const [sortBy, setSortBy] = useState<SortKey>('title')
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [activeCategory, setActiveCategory] = useState<number | undefined>()

  const { data: categories } = trpc.category.all.useQuery()
  const { data: mangas, isLoading } = trpc.manga.library.useQuery({
    categoryId: activeCategory,
    sort: sortBy,
    order: sortBy === 'title' ? 'asc' : 'desc',
  })

  const unreadCount = (manga: any) =>
    manga.chapters?.filter((c: any) => !c.isRead).length ?? 0

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.2 }}>Library</h1>
          <p className="text-muted text-sm mt-1">
            {mangas?.length ?? 0} manga in collection
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            className="input"
            style={{ width: 'auto', height: '38px', paddingTop: '0', paddingBottom: '0' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
          >
            <option value="title">Title A–Z</option>
            <option value="lastRead">Last Read</option>
            <option value="lastUpdated">Last Updated</option>
            <option value="dateAdded">Date Added</option>
            <option value="unread">Unread</option>
          </select>

          {/* Layout toggle */}
          <button
            className={`btn btn-icon${layout === 'grid' ? ' btn-primary' : ' btn-secondary'}`}
            onClick={() => setLayout('grid')}
            title="Grid view"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            className={`btn btn-icon${layout === 'list' ? ' btn-primary' : ' btn-secondary'}`}
            onClick={() => setLayout('list')}
            title="List view"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Category tabs */}
      {categories && categories.length > 0 && (
        <div className="tabs mb-6" style={{ overflowX: 'auto', width: 'fit-content', maxWidth: '100%' }}>
          <button
            className={`tab${!activeCategory ? ' active' : ''}`}
            onClick={() => setActiveCategory(undefined)}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`tab${activeCategory === cat.id ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="manga-grid">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton" style={{ aspectRatio: '2/3', borderRadius: '14px' }} />
              <div className="skeleton mt-2" style={{ height: '14px', borderRadius: '6px' }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!mangas || mangas.length === 0) && (
        <div className="empty-state">
          <BookOpen size={64} className="empty-state-icon" />
          <h2 className="empty-state-title">Your library is empty</h2>
          <p className="empty-state-description">
            Browse sources and add manga to your library to see them here.
          </p>
          <a href="/sources" className="btn btn-primary mt-4">Browse Sources</a>
        </div>
      )}

      {/* Grid layout */}
      {!isLoading && mangas && mangas.length > 0 && layout === 'grid' && (
        <motion.div
          className="manga-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.05 }}
        >
          {mangas.map((manga, i) => (
            <motion.div
              key={manga.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.5) }}
            >
              <MangaCard
                id={manga.id}
                title={manga.title}
                thumbnailUrl={manga.thumbnailUrl}
                unreadCount={unreadCount(manga)}
                inLibrary={manga.inLibrary}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* List layout */}
      {!isLoading && mangas && mangas.length > 0 && layout === 'list' && (
        <div className="flex flex-col gap-2">
          {mangas.map((manga) => (
            <motion.a
              key={manga.id}
              href={`/manga/${manga.id}`}
              className="card flex items-center gap-4"
              style={{ padding: '0.75rem 1rem', textDecoration: 'none' }}
              whileHover={{ x: 4 }}
              transition={{ duration: 0.15 }}
            >
              <img
                src={manga.thumbnailUrl ? `/api/proxy?url=${encodeURIComponent(manga.thumbnailUrl)}` : '/placeholder-cover.svg'}
                alt={manga.title}
                style={{ width: 40, height: 60, objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
              />
              <div className="flex-1 truncate">
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }} className="truncate">{manga.title}</p>
                <p className="text-muted text-xs mt-1">{manga._count?.chapters ?? 0} chapters</p>
              </div>
              {unreadCount(manga) > 0 && (
                <span className="badge badge-primary">{unreadCount(manga)} unread</span>
              )}
            </motion.a>
          ))}
        </div>
      )}
    </div>
  )
}
