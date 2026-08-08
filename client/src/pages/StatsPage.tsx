import { motion } from 'framer-motion'
import { BarChart3, BookOpen, BookMarked, Clock, TrendingUp, Star } from 'lucide-react'
import { trpc } from '@/api/trpc'

export default function StatsPage() {
  const { data: overview } = trpc.stats.overview.useQuery()
  const { data: activity } = trpc.stats.recentActivity.useQuery()
  const { data: genres } = trpc.stats.topGenres.useQuery()
  const { data: mostRead } = trpc.stats.mostRead.useQuery()

  const statCards = [
    { label: 'Total Manga', value: overview?.totalManga ?? 0, icon: BookOpen, color: '#7c3aed', bg: 'rgba(124,58,237,0.15)' },
    { label: 'In Library', value: overview?.inLibrary ?? 0, icon: BookMarked, color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
    { label: 'Read Chapters', value: overview?.readChapters ?? 0, icon: Clock, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    { label: 'Downloaded', value: overview?.downloadedChapters ?? 0, icon: TrendingUp, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  ]

  // Simple bar chart for activity
  const maxActivity = Math.max(...(activity?.map((a) => a.count) ?? [1]))

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Statistics</h1>
        <p className="text-muted text-sm mt-1">Your reading journey at a glance</p>
      </div>

      {/* Overview Cards */}
      <div className="stats-grid mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{ border: `1px solid ${stat.color}30` }}
          >
            <div className="stat-icon" style={{ background: stat.bg }}>
              <stat.icon size={22} style={{ color: stat.color }} />
            </div>
            <div className="stat-value">{stat.value.toLocaleString()}</div>
            <div className="stat-label">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Reading Progress */}
      {overview && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ fontWeight: 700 }}>Reading Progress</h2>
            <span className="badge badge-primary">{overview.readingProgress}%</span>
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div className="progress-bar-fill" style={{ width: `${overview.readingProgress}%` }} />
          </div>
          <p className="text-muted text-sm mt-2">
            {overview.readChapters} / {overview.totalChapters} chapters read
          </p>
        </div>
      )}

      {/* Activity Chart */}
      {activity && activity.length > 0 && (
        <div className="card mb-6">
          <h2 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>
            <BarChart3 size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
            Reading Activity (Last 30 Days)
          </h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, overflowX: 'auto' }}>
            {activity.map((day, i) => (
              <motion.div
                key={day.date}
                title={`${day.date}: ${day.count} chapters`}
                style={{
                  flex: '0 0 auto',
                  width: 16,
                  height: `${(day.count / maxActivity) * 100}%`,
                  minHeight: 4,
                  background: 'linear-gradient(to top, var(--color-primary), var(--color-accent))',
                  borderRadius: '4px 4px 0 0',
                  opacity: 0.8,
                }}
                initial={{ scaleY: 0, originY: 1 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.02 }}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Top Genres */}
        {genres && genres.length > 0 && (
          <div className="card">
            <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Top Genres</h2>
            <div className="flex flex-col gap-3">
              {genres.map((g, i) => (
                <div key={g.genre}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{g.genre}</span>
                    <span className="text-xs text-muted">{g.count}</span>
                  </div>
                  <div className="progress-bar" style={{ height: 4 }}>
                    <motion.div
                      className="progress-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${(g.count / (genres[0]?.count || 1)) * 100}%` }}
                      transition={{ delay: i * 0.05, duration: 0.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Most Read */}
        {mostRead && mostRead.length > 0 && (
          <div className="card">
            <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>
              <Star size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: 'var(--color-warning)' }} />
              Most Read
            </h2>
            <div className="flex flex-col gap-3">
              {mostRead.map((item, i) => (
                <motion.div
                  key={item.manga.id}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', width: 16 }}>#{i + 1}</span>
                  <img
                    src={item.manga.thumbnailUrl ? `/api/proxy?url=${encodeURIComponent(item.manga.thumbnailUrl)}` : '/placeholder-cover.svg'}
                    alt={item.manga.title}
                    style={{ width: 32, height: 48, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="truncate text-sm font-semibold">{item.manga.title}</p>
                    <p className="text-xs text-muted">{item.count} sessions</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
