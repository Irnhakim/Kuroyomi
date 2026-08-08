import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { trpc } from '@/api/trpc'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  
  const { data: settings } = trpc.settings.all.useQuery()
  const theme = settings?.theme || 'dark'

  useEffect(() => {
    // Sync class to HTML/Body for theme changes
    document.documentElement.classList.remove('theme-light', 'theme-dark')
    document.documentElement.classList.add(`theme-${theme}`)
  }, [theme])

  return (
    <div className={`app-layout theme-${theme}`}>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={() => setCollapsed((v) => !v)}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 99,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={`main-content${collapsed ? ' sidebar-collapsed' : ''}`}>
        <Topbar onMenuClick={() => setMobileOpen((v) => !v)} />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

