import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

interface MangaCardProps {
  id: number
  title: string
  thumbnailUrl?: string | null
  unreadCount?: number
  inLibrary?: boolean
  size?: 'sm' | 'md' | 'lg'
  showBadge?: boolean
}

const PROXY_BASE = '/api/proxy?url='

function getThumbnailSrc(url?: string | null) {
  if (!url) return '/placeholder-cover.svg'
  if (url.startsWith('/data/')) return url
  return `${PROXY_BASE}${encodeURIComponent(url)}`
}

export default function MangaCard({
  id,
  title,
  thumbnailUrl,
  unreadCount,
  inLibrary,
  size = 'md',
}: MangaCardProps) {
  const navigate = useNavigate()

  return (
    <motion.div
      className={`manga-card${size === 'lg' ? ' large' : ''}`}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/manga/${id}`)}
      style={{ cursor: 'pointer' }}
    >
      <img
        className="manga-card-image"
        src={getThumbnailSrc(thumbnailUrl)}
        alt={title}
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/placeholder-cover.svg'
        }}
      />

      {/* Unread badge */}
      {typeof unreadCount === 'number' && unreadCount > 0 && (
        <div className="manga-card-unread">{unreadCount}</div>
      )}

      {/* In library badge */}
      {inLibrary && (
        <div className="manga-card-badge">♥</div>
      )}

      <div className="manga-card-overlay">
        <p className="manga-card-title">{title}</p>
      </div>
    </motion.div>
  )
}
