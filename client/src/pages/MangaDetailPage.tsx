import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Heart, HeartOff, RefreshCw, Download, BookOpen, Check } from 'lucide-react'
import { trpc } from '@/api/trpc'

const STATUS_LABELS: Record<number, { label: string; className: string }> = {
  0: { label: 'Unknown', className: 'badge-muted' },
  1: { label: 'Ongoing', className: 'badge-success' },
  2: { label: 'Completed', className: 'badge-primary' },
  3: { label: 'Licensed', className: 'badge-warning' },
  5: { label: 'Cancelled', className: 'badge-error' },
  6: { label: 'On Hiatus', className: 'badge-warning' },
}

export default function MangaDetailPage() {
  const { mangaId } = useParams<{ mangaId: string }>()
  const navigate = useNavigate()
  const id = parseInt(mangaId!)

  const utils = trpc.useUtils()
  const { data: manga, isLoading } = trpc.manga.byId.useQuery({ id })
  const { data: chapters, isLoading: chaptersLoading } = trpc.chapter.byMangaId.useQuery({ mangaId: id })

  const addToLibrary = trpc.manga.addToLibrary.useMutation({
    onSuccess: () => utils.manga.byId.invalidate({ id }),
  })
  const removeFromLibrary = trpc.manga.removeFromLibrary.useMutation({
    onSuccess: () => utils.manga.byId.invalidate({ id }),
  })
  const fetchDetails = trpc.manga.fetchDetails.useMutation({
    onSuccess: () => { utils.manga.byId.invalidate({ id }); utils.chapter.byMangaId.invalidate({ mangaId: id }) },
  })
  const fetchChapters = trpc.chapter.fetchFromSource.useMutation({
    onSuccess: () => utils.chapter.byMangaId.invalidate({ mangaId: id }),
  })
  const markRead = trpc.chapter.markRead.useMutation({
    onSuccess: () => utils.chapter.byMangaId.invalidate({ mangaId: id }),
  })
  const addDownload = trpc.download.add.useMutation()

  const [expandDesc, setExpandDesc] = useState(false)
  const [sortDesc, setSortDesc] = useState(true)

  const status = STATUS_LABELS[manga?.status ?? 0] || STATUS_LABELS[0]
  const readCount = chapters?.filter((c) => c.isRead).length ?? 0
  const firstUnread = chapters?.find((c) => !c.isRead)

  const sortedChapters = [...(chapters || [])].sort((a, b) =>
    sortDesc ? b.sourceOrder - a.sourceOrder : a.sourceOrder - b.sourceOrder
  )

  if (isLoading) {
    return (
      <div className="animate-fadeIn">
        <div className="skeleton" style={{ height: 300, borderRadius: 20, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 32, width: '60%', borderRadius: 8, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 80, borderRadius: 8 }} />
      </div>
    )
  }

  if (!manga) return <div className="empty-state"><p>Manga not found</p></div>

  return (
    <div className="animate-fadeIn">
      {/* Back button */}
      <button className="btn btn-ghost btn-icon mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} />
      </button>

      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6"
        style={{ padding: 0, overflow: 'hidden' }}
      >
        {/* Background blur cover */}
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: manga.thumbnailUrl
              ? `url(/api/proxy?url=${encodeURIComponent(manga.thumbnailUrl)}) center/cover`
              : 'var(--color-bg-elevated)',
            filter: 'blur(40px) brightness(0.3)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, padding: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Cover */}
          <img
            src={manga.thumbnailUrl ? `/api/proxy?url=${encodeURIComponent(manga.thumbnailUrl)}` : '/placeholder-cover.svg'}
            alt={manga.title}
            style={{ width: 140, height: 210, objectFit: 'cover', borderRadius: 14, flexShrink: 0, boxShadow: 'var(--shadow-xl)' }}
          />
          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>{manga.title}</h1>
            {manga.author && <p className="text-muted text-sm mb-1">by {manga.author}</p>}
            {manga.artist && manga.artist !== manga.author && (
              <p className="text-muted text-sm mb-3">Art by {manga.artist}</p>
            )}
            <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
              <span className={`badge ${status.className}`}>{status.label}</span>
              {manga.genre?.split(',').slice(0, 4).map((g) => (
                <span key={g} className="badge badge-muted">{g.trim()}</span>
              ))}
            </div>

            {/* Description */}
            {manga.description && (
              <div>
                <p
                  className="text-sm"
                  style={{
                    color: 'var(--color-text-secondary)',
                    display: '-webkit-box',
                    WebkitLineClamp: expandDesc ? 'unset' : 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: expandDesc ? 'visible' : 'hidden',
                  }}
                >
                  {manga.description}
                </p>
                <button
                  className="btn btn-ghost text-sm mt-1"
                  style={{ padding: '2px 0' }}
                  onClick={() => setExpandDesc((v) => !v)}
                >
                  {expandDesc ? 'Show less' : 'Show more'}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-6" style={{ flexWrap: 'wrap' }}>
        {firstUnread && (
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate(`/manga/${id}/chapter/${firstUnread.id}`)}
          >
            <BookOpen size={18} />
            {readCount === 0 ? 'Start Reading' : 'Continue Reading'}
          </button>
        )}

        <button
          className={`btn ${manga.inLibrary ? 'btn-danger' : 'btn-secondary'}`}
          onClick={() => manga.inLibrary
            ? removeFromLibrary.mutate({ mangaId: id })
            : addToLibrary.mutate({ mangaId: id })
          }
        >
          {manga.inLibrary ? <HeartOff size={18} /> : <Heart size={18} />}
          {manga.inLibrary ? 'In Library' : 'Add to Library'}
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => fetchDetails.mutate({ mangaId: id })}
          disabled={fetchDetails.isPending}
        >
          <RefreshCw size={18} className={fetchDetails.isPending ? 'animate-pulse' : ''} />
          Refresh
        </button>
      </div>

      {/* Chapter list header */}
      <div className="flex items-center justify-between mb-3">
        <h2 style={{ fontWeight: 700 }}>
          {chapters?.length ?? 0} Chapters
          <span className="text-muted font-semibold text-sm ml-2">({readCount} read)</span>
        </h2>
        <div className="flex gap-2">
          <button
            className="btn btn-ghost text-sm"
            onClick={() => setSortDesc((v) => !v)}
          >
            {sortDesc ? '↓ Newest First' : '↑ Oldest First'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fetchChapters.mutate({ mangaId: id })}
            disabled={fetchChapters.isPending}
          >
            <RefreshCw size={14} />
            Fetch
          </button>
        </div>
      </div>

      {/* Chapter list */}
      {chaptersLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />
          ))}
        </div>
      )}

      <div className="chapter-list">
        {sortedChapters.map((ch) => (
          <div
            key={ch.id}
            className={`chapter-item${ch.isRead ? ' read' : ''}${ch.isBookmarked ? ' bookmarked' : ''}`}
            onClick={() => navigate(`/manga/${id}/chapter/${ch.id}`)}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="chapter-name">{ch.name}</p>
              {ch.scanlator && <p className="chapter-scanlator">{ch.scanlator}</p>}
            </div>
            <div className="chapter-meta">
              {ch.dateUpload && (
                <span className="chapter-date">
                  {new Date(ch.dateUpload).toLocaleDateString()}
                </span>
              )}
              {ch.isDownloaded && <span title="Downloaded" style={{ color: 'var(--color-success)' }}>↓</span>}
              <button
                className="btn btn-ghost btn-icon"
                onClick={(e) => {
                  e.stopPropagation()
                  markRead.mutate({ chapterId: ch.id, read: !ch.isRead })
                }}
                title={ch.isRead ? 'Mark unread' : 'Mark read'}
              >
                <Check size={16} style={{ color: ch.isRead ? 'var(--color-success)' : 'var(--color-text-muted)' }} />
              </button>
              <button
                className="btn btn-ghost btn-icon"
                onClick={(e) => {
                  e.stopPropagation()
                  addDownload.mutate({ chapterId: ch.id, mangaId: id })
                }}
                title="Download"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
