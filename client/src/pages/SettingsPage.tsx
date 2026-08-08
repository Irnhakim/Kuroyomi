import { useState } from 'react'
import { Settings, Monitor, BookOpen, Globe, Database, RefreshCw, Save } from 'lucide-react'
import { trpc } from '@/api/trpc'
import { motion } from 'framer-motion'

export default function SettingsPage() {
  const utils = trpc.useUtils()
  const { data: settings, isLoading } = trpc.settings.all.useQuery()
  const setMany = trpc.settings.setMany.useMutation({ onSuccess: () => utils.settings.all.invalidate() })

  const [local, setLocal] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  const merged = { ...settings, ...local }

  const update = (key: string, value: string) => {
    setLocal((prev) => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    await setMany.mutateAsync(local)
    setLocal({})
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>

  const sections = [
    {
      title: 'Appearance',
      icon: Monitor,
      fields: [
        { key: 'theme', label: 'Theme', type: 'select', options: [{ v: 'dark', l: 'Dark' }, { v: 'light', l: 'Light' }] },
        { key: 'language', label: 'Language', type: 'select', options: [{ v: 'id', l: '🇮🇩 Bahasa Indonesia' }, { v: 'en', l: '🇺🇸 English' }, { v: 'ja', l: '🇯🇵 Japanese' }] },
        { key: 'libraryLayout', label: 'Library Layout', type: 'select', options: [{ v: 'grid', l: 'Grid' }, { v: 'list', l: 'List' }] },
        { key: 'libraryColumns', label: 'Grid Columns', type: 'select', options: [{ v: '2', l: '2' }, { v: '3', l: '3' }, { v: '4', l: '4' }, { v: '5', l: '5' }] },
      ],
    },
    {
      title: 'Reader',
      icon: BookOpen,
      fields: [
        { key: 'readerMode', label: 'Default Mode', type: 'select', options: [{ v: 'paged-ltr', l: 'Left to Right' }, { v: 'paged-rtl', l: 'Right to Left' }, { v: 'webtoon', l: 'Webtoon Scroll' }] },
        { key: 'readerBackground', label: 'Background', type: 'select', options: [{ v: 'black', l: 'Black' }, { v: 'white', l: 'White' }, { v: 'gray', l: 'Gray' }] },
        { key: 'readerPageFit', label: 'Page Fit', type: 'select', options: [{ v: 'width', l: 'Fit Width' }, { v: 'height', l: 'Fit Height' }, { v: 'original', l: 'Original Size' }] },
      ],
    },
    {
      title: 'Downloads',
      icon: Database,
      fields: [
        { key: 'downloadAheadLimit', label: 'Download Ahead Limit', type: 'select', options: [{ v: '0', l: 'Off' }, { v: '3', l: '3 chapters' }, { v: '5', l: '5 chapters' }, { v: '10', l: '10 chapters' }] },
      ],
    },
    {
      title: 'Library Update',
      icon: RefreshCw,
      fields: [
        { key: 'autoUpdateLibrary', label: 'Auto Update Library', type: 'select', options: [{ v: 'true', l: 'Enabled' }, { v: 'false', l: 'Disabled' }] },
        { key: 'updateInterval', label: 'Update Interval', type: 'select', options: [{ v: '6', l: 'Every 6 hours' }, { v: '12', l: 'Every 12 hours' }, { v: '24', l: 'Every 24 hours' }] },
      ],
    },
    {
      title: 'Extensions',
      icon: Globe,
      fields: [
        { key: 'extensionRepoUrl', label: 'Extension Repository URL', type: 'text' },
      ],
    },
  ]

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Settings</h1>
          <p className="text-muted text-sm mt-1">Configure Kuroyomi to your preference</p>
        </div>
        {Object.keys(local).length > 0 && (
          <button className="btn btn-primary" onClick={save} disabled={setMany.isPending}>
            <Save size={16} />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6" style={{ maxWidth: 600 }}>
        {sections.map((section, si) => (
          <motion.div
            key={section.title}
            className="card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.08 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <section.icon size={18} style={{ color: 'var(--color-primary-lighter)' }} />
              </div>
              <h2 style={{ fontWeight: 700 }}>{section.title}</h2>
            </div>

            <div className="flex flex-col gap-4">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="text-sm font-semibold" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      className="input"
                      value={merged[field.key] || ''}
                      onChange={(e) => update(field.key, e.target.value)}
                    >
                      {field.options?.map((opt) => (
                        <option key={opt.v} value={opt.v}>{opt.l}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="input"
                      type="text"
                      value={merged[field.key] || ''}
                      onChange={(e) => update(field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* App info */}
      <div className="card mt-6" style={{ maxWidth: 600 }}>
        <p className="text-muted text-sm">
          <strong style={{ color: 'var(--color-text-primary)' }}>Kuroyomi</strong> v1.0.0 · Built with ♥ for personal use
        </p>
        <p className="text-muted text-xs mt-1">
          Inspired by Tachiyomi, Mihon, and Suwayomi
        </p>
      </div>
    </div>
  )
}
