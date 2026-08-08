import { useLocation } from 'react-router-dom'
import { Menu, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Library',
  '/library': 'Library',
  '/sources': 'Browse Sources',
  '/updates': 'Updates',
  '/history': 'History',
  '/downloads': 'Downloads',
  '/extensions': 'Extensions',
  '/stats': 'Statistics',
  '/settings': 'Settings',
}

interface TopbarProps {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')

  const title = PAGE_TITLES[location.pathname] || 'Kuroyomi'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/sources?q=${encodeURIComponent(query.trim())}`)
      setQuery('')
      setSearching(false)
    }
  }

  return (
    <header className="topbar">
      <button className="btn btn-ghost btn-icon" onClick={onMenuClick} style={{ display: 'none' }} id="mobile-menu-btn">
        <Menu size={20} />
      </button>

      {searching ? (
        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search className="search-input-icon" size={16} />
            <input
              className="input search-input"
              placeholder="Search manga across sources..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              style={{ height: '38px' }}
            />
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => setSearching(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <>
          <h1 className="topbar-title">{title}</h1>
          <div className="topbar-actions">
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setSearching(true)}
              title="Search (Ctrl+K)"
            >
              <Search size={18} />
            </button>
          </div>
        </>
      )}
    </header>
  )
}
