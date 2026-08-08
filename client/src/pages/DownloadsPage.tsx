import { motion } from 'framer-motion'
import { Download, Play, Pause, Trash2, RotateCcw, X } from 'lucide-react'
import { trpc } from '@/api/trpc'
import { useEffect } from 'react'
import { io } from 'socket.io-client'

const socket = io('/', { path: '/socket.io' })

export default function DownloadsPage() {
  const utils = trpc.useUtils()
  const { data: queue, isLoading } = trpc.download.queue.useQuery()
  const { data: all } = trpc.download.all.useQuery()
  const startAll = trpc.download.startAll.useMutation({ onSuccess: () => utils.download.queue.invalidate() })
  const pauseAll = trpc.download.pauseAll.useMutation({ onSuccess: () => utils.download.queue.invalidate() })
  const clearCompleted = trpc.download.clearCompleted.useMutation({ onSuccess: () => { utils.download.queue.invalidate(); utils.download.all.invalidate() } })
  const retry = trpc.download.retry.useMutation({ onSuccess: () => utils.download.queue.invalidate() })
  const cancel = trpc.download.cancel.useMutation({ onSuccess: () => utils.download.queue.invalidate() })

  // Real-time updates
  useEffect(() => {
    socket.on('download:progress', () => utils.download.queue.invalidate())
    socket.on('download:complete', () => { utils.download.queue.invalidate(); utils.download.all.invalidate() })
    socket.on('download:error', () => utils.download.queue.invalidate())
    return () => { socket.off('download:progress'); socket.off('download:complete'); socket.off('download:error') }
  }, [])

  const activeCount = queue?.filter((d) => d.status === 'DOWNLOADING' || d.status === 'PENDING').length ?? 0
  const errorCount = queue?.filter((d) => d.status === 'ERROR').length ?? 0

  const statusColor = (status: string) => ({
    DOWNLOADING: 'var(--color-accent)',
    DOWNLOADED: 'var(--color-success)',
    PENDING: 'var(--color-text-muted)',
    ERROR: 'var(--color-error)',
    CANCELLED: 'var(--color-text-disabled)',
  }[status] || 'var(--color-text-muted)')

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Downloads</h1>
          <p className="text-muted text-sm mt-1">
            {activeCount} active · {errorCount} errors
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => startAll.mutate()}>
            <Play size={14} /> Start All
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => pauseAll.mutate()}>
            <Pause size={14} /> Pause
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => clearCompleted.mutate()}>
            <Trash2 size={14} /> Clear Done
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />
          ))}
        </div>
      )}

      {!isLoading && (!queue || queue.length === 0) && (
        <div className="empty-state">
          <Download size={64} className="empty-state-icon" />
          <h2 className="empty-state-title">No downloads</h2>
          <p className="empty-state-description">Downloaded chapters will appear here for offline reading.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {queue?.map((dl, i) => (
          <motion.div
            key={dl.id}
            className="card"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            style={{ padding: '0.875rem 1rem' }}
          >
            <div className="flex items-center gap-3">
              <img
                src={dl.manga.thumbnailUrl ? `/api/proxy?url=${encodeURIComponent(dl.manga.thumbnailUrl)}` : '/placeholder-cover.svg'}
                alt={dl.manga.title}
                style={{ width: 36, height: 54, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem' }} className="truncate">{dl.manga.title}</p>
                <p className="text-muted text-xs truncate">{dl.chapter.name}</p>
                {dl.status === 'DOWNLOADING' && (
                  <div className="progress-bar mt-2" style={{ height: 3 }}>
                    <div className="progress-bar-fill" style={{ width: `${dl.progress}%`, transition: 'width 0.5s' }} />
                  </div>
                )}
                {dl.error && <p style={{ color: 'var(--color-error)', fontSize: '0.75rem' }} className="mt-1 truncate">{dl.error}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '0.75rem', color: statusColor(dl.status), fontWeight: 600 }}>
                  {dl.status === 'DOWNLOADING' ? `${Math.round(dl.progress)}%` : dl.status}
                </span>
                {dl.status === 'ERROR' && (
                  <button className="btn btn-ghost btn-icon" onClick={() => retry.mutate({ downloadId: dl.id })} title="Retry">
                    <RotateCcw size={14} />
                  </button>
                )}
                {(dl.status === 'PENDING' || dl.status === 'ERROR') && (
                  <button className="btn btn-ghost btn-icon" onClick={() => cancel.mutate({ downloadId: dl.id })} title="Cancel">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
