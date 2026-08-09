import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Settings2, BookOpen,
  AlignJustify, ChevronLeft, ChevronRight, X,
} from 'lucide-react'
import { trpc } from '@/api/trpc'

type ReaderMode = 'paged-ltr' | 'paged-rtl' | 'webtoon'

const PROXY = (url: string) => url.startsWith('/data/')
  ? url
  : `/api/proxy?url=${encodeURIComponent(url)}`

export default function ReaderPage() {
  const { mangaId, chapterId } = useParams<{ mangaId: string; chapterId: string }>()
  const navigate = useNavigate()
  const mangaIdNum = parseInt(mangaId!)
  const chapterIdNum = parseInt(chapterId!)

  const [mode, setMode] = useState<ReaderMode>('paged-ltr')
  const [currentPage, setCurrentPage] = useState(0)
  const [showUI, setShowUI] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [brightness, setBrightness] = useState(100)
  const uiTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const webtoonRef = useRef<HTMLDivElement>(null)

  const { data: chapter } = trpc.chapter.byId.useQuery({ id: chapterIdNum })
  const { data: pages, isLoading } = trpc.chapter.pages.useQuery({ chapterId: chapterIdNum })
  const { data: chapters } = trpc.chapter.byMangaId.useQuery({ mangaId: mangaIdNum })

  const updateProgress = trpc.chapter.updateProgress.useMutation()

  // Auto-hide UI after 3s
  const resetUITimer = useCallback(() => {
    setShowUI(true)
    if (uiTimer.current) clearTimeout(uiTimer.current)
    uiTimer.current = setTimeout(() => setShowUI(false), 3000)
  }, [])

  useEffect(() => {
    resetUITimer()
    return () => { if (uiTimer.current) clearTimeout(uiTimer.current) }
  }, [])

  // Save progress
  useEffect(() => {
    if (pages && pages.length > 0) {
      updateProgress.mutate({ chapterId: chapterIdNum, page: currentPage })
    }
  }, [currentPage, chapterIdNum])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (mode === 'webtoon') return
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault()
          prevPage()
          break
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          e.preventDefault()
          nextPage()
          break
        case 'Escape':
          navigate(`/manga/${mangaId}`)
          break
        case 'f':
        case 'F':
          toggleFullscreen()
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentPage, pages, mode])

  const pageCount = pages?.length ?? 0

  const prevPage = () => {
    if (currentPage > 0) setCurrentPage((p) => p - 1)
    else goToPrevChapter()
  }

  const nextPage = () => {
    if (currentPage < pageCount - 1) setCurrentPage((p) => p + 1)
    else goToNextChapter()
  }

  const goToPrevChapter = () => {
    if (!chapters) return
    const sorted = [...chapters].sort((a, b) => a.sourceOrder - b.sourceOrder)
    const idx = sorted.findIndex((c) => c.id === chapterIdNum)
    if (idx > 0) {
      navigate(`/manga/${mangaId}/chapter/${sorted[idx - 1].id}`)
      setCurrentPage(0)
    }
  }

  const goToNextChapter = () => {
    if (!chapters) return
    const sorted = [...chapters].sort((a, b) => a.sourceOrder - b.sourceOrder)
    const idx = sorted.findIndex((c) => c.id === chapterIdNum)
    if (idx < sorted.length - 1) {
      navigate(`/manga/${mangaId}/chapter/${sorted[idx + 1].id}`)
      setCurrentPage(0)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handleTap = (zone: 'left' | 'center' | 'right') => {
    resetUITimer()
    if (mode === 'webtoon') return
    if (zone === 'left') {
      mode === 'paged-rtl' ? nextPage() : prevPage()
    } else if (zone === 'right') {
      mode === 'paged-rtl' ? prevPage() : nextPage()
    }
  }

  return (
    <div
      className="reader-container"
      style={{ filter: brightness !== 100 ? `brightness(${brightness}%)` : undefined }}
      onMouseMove={resetUITimer}
      onTouchStart={resetUITimer}
    >
      {/* Top toolbar */}
      <div className={`reader-toolbar${showUI ? '' : ' hidden'}`}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate(`/manga/${mangaId}`)}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {chapter?.name}
          </p>
        </div>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setShowSettings((v) => !v)}
          title="Reader settings"
        >
          <Settings2 size={20} />
        </button>
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 280,
              background: 'var(--color-bg-surface)', borderLeft: '1px solid var(--color-border)',
              zIndex: 20, padding: '1.5rem', overflowY: 'auto',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 style={{ fontWeight: 700 }}>Reader Settings</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowSettings(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {/* Mode */}
              <div>
                <label className="text-sm font-semibold mb-2" style={{ display: 'block', color: 'var(--color-text-secondary)' }}>
                  Reading Mode
                </label>
                <div className="tabs" style={{ flexDirection: 'column', gap: 4 }}>
                  {(['paged-ltr', 'paged-rtl', 'webtoon'] as ReaderMode[]).map((m) => (
                    <button
                      key={m}
                      className={`tab${mode === m ? ' active' : ''}`}
                      onClick={() => setMode(m)}
                      style={{ textAlign: 'left', justifyContent: 'flex-start' }}
                    >
                      {m === 'paged-ltr' && <><BookOpen size={14} style={{ marginRight: 8 }} /> Left to Right</>}
                      {m === 'paged-rtl' && <><BookOpen size={14} style={{ marginRight: 8 }} /> Right to Left</>}
                      {m === 'webtoon' && <><AlignJustify size={14} style={{ marginRight: 8 }} /> Webtoon Scroll</>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brightness */}
              <div>
                <label className="text-sm font-semibold mb-2" style={{ display: 'block', color: 'var(--color-text-secondary)' }}>
                  Brightness: {brightness}%
                </label>
                <input
                  type="range"
                  min={30}
                  max={100}
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="page-slider"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Keyboard shortcuts */}
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                  Keyboard Shortcuts
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    ['← / ↑', 'Previous page'],
                    ['→ / ↓ / Space', 'Next page'],
                    ['F', 'Fullscreen'],
                    ['Esc', 'Exit reader'],
                  ].map(([key, action]) => (
                    <div key={key} className="flex items-center justify-between">
                      <code style={{ background: 'var(--color-bg-elevated)', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem' }}>{key}</code>
                      <span className="text-xs text-muted">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {isLoading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      )}

      {/* PAGED MODE */}
      {!isLoading && mode !== 'webtoon' && pages && (
        <>
          {/* Tap zones */}
          <div className="reader-tap-left" onClick={() => handleTap('left')} />
          <div className="reader-tap-center" onClick={() => handleTap('center')} />
          <div className="reader-tap-right" onClick={() => handleTap('right')} />

          <div className="reader-pages-paged">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                className="reader-page-paged"
                initial={{ opacity: 0, x: mode === 'paged-rtl' ? -40 : 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === 'paged-rtl' ? 40 : -40 }}
                transition={{ duration: 0.2 }}
              >
                {pages[currentPage] && (
                  <img
                    src={PROXY(pages[currentPage].imageUrl)}
                    alt={`Page ${currentPage + 1}`}
                    style={{ maxWidth: '100vw', maxHeight: '100vh', objectFit: 'contain' }}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Prev / Next buttons */}
          <button
            onClick={prevPage}
            className="btn btn-ghost"
            style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              opacity: showUI ? 0.8 : 0, transition: 'opacity 0.2s', zIndex: 6,
            }}
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={nextPage}
            className="btn btn-ghost"
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              opacity: showUI ? 0.8 : 0, transition: 'opacity 0.2s', zIndex: 6,
            }}
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* WEBTOON MODE */}
      {!isLoading && mode === 'webtoon' && pages && (
        <div className="reader-pages-webtoon" ref={webtoonRef} onClick={resetUITimer}>
          {pages.map((page, i) => (
            <div key={i} className="reader-page-webtoon">
              <img
                src={PROXY(page.imageUrl)}
                alt={`Page ${i + 1}`}
                loading="lazy"
                style={{ width: '100%', maxWidth: 800, margin: '0 auto', display: 'block' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Bottom bar */}
      <div className={`reader-bottom-bar${showUI ? '' : ' hidden'}`}>
        <button className="btn btn-ghost btn-icon" onClick={goToPrevChapter}>
          <ArrowLeft size={18} />
        </button>
        <span className="reader-page-count">{currentPage + 1} / {pageCount}</span>
        {mode !== 'webtoon' && (
          <>
            <div className="reader-progress" style={{ flex: 1 }}>
              <input
                type="range"
                min={0}
                max={Math.max(0, pageCount - 1)}
                value={currentPage}
                onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                className="page-slider"
                style={{ width: '100%' }}
              />
            </div>
          </>
        )}
        <button className="btn btn-ghost btn-icon" onClick={goToNextChapter}>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}
