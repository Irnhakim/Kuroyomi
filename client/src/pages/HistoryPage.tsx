import { motion } from 'framer-motion'
import { Clock, Trash2 } from 'lucide-react'
import { trpc } from '@/api/trpc'
import { useNavigate } from 'react-router-dom'

export default function HistoryPage() {
  const navigate = useNavigate()
  const utils = trpc.useUtils()
  const { data, isLoading } = trpc.history.recentManga.useQuery({ limit: 50 })
  const clearAll = trpc.history.clear.useMutation({ onSuccess: () => utils.history.recentManga.invalidate() })

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>History</h1>
          <p className="text-muted text-sm mt-1">Recently read manga</p>
        </div>
        <button className="btn btn-danger btn-sm" onClick={() => clearAll.mutate()} disabled={clearAll.isPending}>
          <Trash2 size={16} /> Clear All
        </button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />
          ))}
        </div>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <div className="empty-state">
          <Clock size={64} className="empty-state-icon" />
          <h2 className="empty-state-title">No reading history</h2>
          <p className="empty-state-description">Start reading manga to track your history here.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {data?.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="card flex items-center gap-4"
            style={{ padding: '0.75rem 1rem', cursor: 'pointer' }}
            onClick={() => navigate(`/manga/${item.mangaId}/chapter/${item.chapterId}`)}
          >
            <img
              src={item.manga.thumbnailUrl ? `/api/proxy?url=${encodeURIComponent(item.manga.thumbnailUrl)}` : '/placeholder-cover.svg'}
              alt={item.manga.title}
              style={{ width: 44, height: 66, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
            />
            <div className="flex-1" style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: '0.9rem' }} className="truncate">{item.manga.title}</p>
              <p className="text-muted text-xs mt-1 truncate">{item.chapter.name}</p>
              <p className="text-muted text-xs">
                Page {item.chapter.lastPageRead + 1}{item.chapter.pageCount > 0 ? ` / ${item.chapter.pageCount}` : ''}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">{new Date(item.readAt).toLocaleDateString()}</p>
              {item.chapter.pageCount > 0 && (
                <div className="progress-bar mt-2" style={{ width: 60 }}>
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${Math.min(100, ((item.chapter.lastPageRead + 1) / item.chapter.pageCount) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
