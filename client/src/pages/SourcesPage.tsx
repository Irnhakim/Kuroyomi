import { useState } from 'react'
import { motion } from 'framer-motion'
import { Globe, Search } from 'lucide-react'
import { trpc } from '@/api/trpc'
import { useNavigate } from 'react-router-dom'

const LANG_LABELS: Record<string, string> = {
  en: '🇺🇸 English', id: '🇮🇩 Indonesian', ja: '🇯🇵 Japanese',
  zh: '🇨🇳 Chinese', ko: '🇰🇷 Korean', all: '🌐 All Languages',
}

export default function SourcesPage() {
  const [search, setSearch] = useState('')
  const [langFilter, setLangFilter] = useState('all')
  const { data: sources, isLoading } = trpc.source.all.useQuery()
  const navigate = useNavigate()

  const filtered = sources?.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    const matchLang = langFilter === 'all' || s.lang === langFilter
    return matchSearch && matchLang
  })

  const langs = ['all', ...new Set(sources?.map((s) => s.lang) || [])]

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Browse Sources</h1>
          <p className="text-muted text-sm mt-1">{sources?.length ?? 0} sources available</p>
        </div>
        <a href="/extensions" className="btn btn-secondary">
          <Globe size={16} />
          Manage Extensions
        </a>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="search-input-wrapper" style={{ flex: 1, maxWidth: 360 }}>
          <Search className="search-input-icon" size={16} />
          <input
            className="input search-input"
            placeholder="Filter sources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input"
          style={{ width: 'auto', height: '44px', paddingTop: 0, paddingBottom: 0 }}
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value)}
        >
          {langs.map((lang) => (
            <option key={lang} value={lang}>{LANG_LABELS[lang] || lang.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 72, borderRadius: 14 }} />
          ))}
        </div>
      )}

      {!isLoading && (!filtered || filtered.length === 0) && (
        <div className="empty-state">
          <Globe size={64} className="empty-state-icon" />
          <h2 className="empty-state-title">No sources found</h2>
          <p className="empty-state-description">
            Install extensions to add manga sources.
          </p>
          <a href="/extensions" className="btn btn-primary mt-4">Browse Extensions</a>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filtered?.map((source, i) => (
          <motion.div
            key={source.id}
            className="card flex items-center gap-4"
            style={{ padding: '1rem', cursor: 'pointer' }}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            whileHover={{ x: 4 }}
            onClick={() => navigate(`/source/${source.id}`)}
          >
            <img
              src={source.iconUrl || '/placeholder-cover.svg'}
              alt={source.name}
              style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', background: 'var(--color-bg-elevated)' }}
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-cover.svg' }}
            />
            <div className="flex-1">
              <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{source.name}</p>
              <p className="text-muted text-xs mt-1">
                {LANG_LABELS[source.lang] || source.lang.toUpperCase()}
              </p>
            </div>
            <span className="badge badge-muted">{source.lang}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
