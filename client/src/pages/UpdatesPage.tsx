import { RefreshCw } from 'lucide-react'
import { trpc } from '@/api/trpc'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function UpdatesPage() {
  const navigate = useNavigate()
  const utils = trpc.useUtils()

  // Show recently updated chapters (last fetched from all library manga)
  const { data: mangas } = trpc.manga.library.useQuery({ sort: 'lastUpdated', order: 'desc' })

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Updates</h1>
          <p className="text-muted text-sm mt-1">Recently updated manga in your library</p>
        </div>
        <button className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Update All
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {mangas?.slice(0, 30).map((manga, i) => (
          <motion.div
            key={manga.id}
            className="card flex items-center gap-4"
            style={{ padding: '0.75rem 1rem', cursor: 'pointer' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            whileHover={{ x: 4 }}
            onClick={() => navigate(`/manga/${manga.id}`)}
          >
            <img
              src={manga.thumbnailUrl ? `/api/proxy?url=${encodeURIComponent(manga.thumbnailUrl)}` : '/placeholder-cover.svg'}
              alt={manga.title}
              style={{ width: 44, height: 66, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: '0.9rem' }} className="truncate">{manga.title}</p>
              <p className="text-muted text-xs mt-1">
                {manga.chaptersLastFetchedAt
                  ? `Updated ${new Date(manga.chaptersLastFetchedAt).toLocaleDateString()}`
                  : 'Not yet fetched'}
              </p>
            </div>
            {manga._count?.chapters > 0 && (
              <span className="badge badge-muted">{manga._count.chapters} ch</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
