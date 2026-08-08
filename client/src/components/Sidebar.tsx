import { NavLink } from 'react-router-dom'
import {
  BookOpen, Home, Globe, Clock, Download,
  Puzzle, Settings, BarChart3, RefreshCw,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { trpc } from '@/api/trpc'

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onToggle: () => void
  onMobileClose: () => void
}

const mainNav = [
  { to: '/', icon: Home, label: 'Library', end: true },
  { to: '/sources', icon: Globe, label: 'Browse' },
  { to: '/updates', icon: RefreshCw, label: 'Updates' },
  { to: '/history', icon: Clock, label: 'History' },
]

const toolsNav = [
  { to: '/downloads', icon: Download, label: 'Downloads' },
  { to: '/extensions', icon: Puzzle, label: 'Extensions' },
  { to: '/stats', icon: BarChart3, label: 'Statistics' },
]

const settingsNav = [
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ collapsed, mobileOpen, onToggle }: SidebarProps) {
  const { data: downloads } = trpc.download.queue.useQuery(undefined, {
    refetchInterval: 5000,
  })

  const activeDownloads = downloads?.filter((d) => d.status === 'DOWNLOADING' || d.status === 'PENDING').length || 0

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">黒</div>
        <span className="sidebar-title">Kuroyomi</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* Main */}
        <div className="nav-section">
          <div className="nav-section-label">Main</div>
          {mainNav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon className="nav-icon" size={20} />
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </div>

        {/* Tools */}
        <div className="nav-section">
          <div className="nav-section-label">Tools</div>
          {toolsNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon className="nav-icon" size={20} />
              <span className="nav-label">{label}</span>
              {label === 'Downloads' && activeDownloads > 0 && (
                <span className="nav-badge">{activeDownloads}</span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Settings */}
        <div className="nav-section">
          <div className="nav-section-label">System</div>
          {settingsNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon className="nav-icon" size={20} />
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="sidebar-footer">
        <button className="btn btn-ghost btn-icon w-full" onClick={onToggle} title="Toggle sidebar">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  )
}
