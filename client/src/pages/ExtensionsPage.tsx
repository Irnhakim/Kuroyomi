import { useState } from 'react'
import { motion } from 'framer-motion'
import { Puzzle, Download, RefreshCw, Trash2, Globe, Search } from 'lucide-react'
import { trpc } from '@/api/trpc'

export default function ExtensionsPage() {
  const [tab, setTab] = useState<'installed' | 'available'>('installed')
  const [search, setSearch] = useState('')
  const [langFilter, setLangFilter] = useState('all')

  const utils = trpc.useUtils()
  const { data: installed } = trpc.extension.installed.useQuery()
  const { data: available, isLoading: loadingAvailable } = trpc.extension.available.useQuery(undefined, {
    enabled: tab === 'available',
  })
  const installMut = trpc.extension.install.useMutation({ onSuccess: () => utils.extension.installed.invalidate() })
  const uninstallMut = trpc.extension.uninstall.useMutation({ onSuccess: () => utils.extension.installed.invalidate() })
  const updateMut = trpc.extension.update.useMutation({ onSuccess: () => utils.extension.installed.invalidate() })
  const checkUpdates = trpc.extension.checkUpdates.useMutation({ onSuccess: () => utils.extension.installed.invalidate() })

  const installedPkgs = new Set(installed?.map((e) => e.pkgName))

  const filteredAvailable = available?.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase())
    const matchLang = langFilter === 'all' || e.lang === langFilter
    return matchSearch && matchLang
  })

  const langs = ['all', ...new Set(available?.map((e) => e.lang).filter((l) => l !== 'all') || [])]

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Extensions</h1>
          <p className="text-muted text-sm mt-1">{installed?.length ?? 0} installed</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => checkUpdates.mutate()} disabled={checkUpdates.isPending}>
          <RefreshCw size={14} className={checkUpdates.isPending ? 'animate-pulse' : ''} />
          Check Updates
        </button>
      </div>

      <div className="tabs mb-6" style={{ width: 'fit-content' }}>
        <button className={`tab${tab === 'installed' ? ' active' : ''}`} onClick={() => setTab('installed')}>
          Installed ({installed?.length ?? 0})
        </button>
        <button className={`tab${tab === 'available' ? ' active' : ''}`} onClick={() => setTab('available')}>
          Available
        </button>
      </div>

      {/* Installed */}
      {tab === 'installed' && (
        <div className="flex flex-col gap-2">
          {(!installed || installed.length === 0) && (
            <div className="empty-state">
              <Puzzle size={64} className="empty-state-icon" />
              <h2 className="empty-state-title">No extensions installed</h2>
              <p className="empty-state-description">Browse available extensions to add manga sources.</p>
              <button className="btn btn-primary mt-4" onClick={() => setTab('available')}>Browse Extensions</button>
            </div>
          )}
          {installed?.map((ext, i) => (
            <motion.div
              key={ext.pkgName}
              className="card flex items-center gap-4"
              style={{ padding: '1rem' }}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <img
                src={ext.iconUrl || '/placeholder-cover.svg'}
                alt={ext.name}
                style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', background: 'var(--color-bg-elevated)' }}
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-cover.svg' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600 }}>{ext.name}</p>
                <p className="text-muted text-xs">{ext.lang.toUpperCase()} · v{ext.versionName}</p>
              </div>
              {ext.hasUpdate && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => updateMut.mutate({ pkgName: ext.pkgName })}
                  disabled={updateMut.isPending}
                >
                  Update
                </button>
              )}
              <button
                className="btn btn-danger btn-sm"
                onClick={() => uninstallMut.mutate({ pkgName: ext.pkgName })}
                disabled={uninstallMut.isPending}
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Available */}
      {tab === 'available' && (
        <>
          <div className="flex gap-3 mb-4">
            <div className="search-input-wrapper" style={{ flex: 1, maxWidth: 360 }}>
              <Search className="search-input-icon" size={16} />
              <input
                className="input search-input"
                placeholder="Search extensions..."
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
                <option key={lang} value={lang}>{lang === 'all' ? '🌐 All' : lang.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {loadingAvailable && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 72, borderRadius: 14 }} />
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {filteredAvailable?.map((ext, i) => (
              <motion.div
                key={ext.pkgName}
                className="card flex items-center gap-4"
                style={{ padding: '0.875rem 1rem' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
              >
                <img
                  src={ext.iconUrl || '/placeholder-cover.svg'}
                  alt={ext.name}
                  style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', background: 'var(--color-bg-elevated)' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-cover.svg' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{ext.name}</p>
                  <p className="text-muted text-xs">{ext.lang.toUpperCase()} · v{ext.versionName}</p>
                </div>
                {ext.isNsfw && <span className="badge badge-error">18+</span>}
                {installedPkgs.has(ext.pkgName) ? (
                  <span className="badge badge-success">Installed</span>
                ) : (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => installMut.mutate({ pkgName: ext.pkgName })}
                    disabled={installMut.isPending}
                  >
                    <Download size={14} />
                    Install
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
