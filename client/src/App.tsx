import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from '@/components/Layout'
import LibraryPage from '@/pages/LibraryPage'
import SourcesPage from '@/pages/SourcesPage'
import SourceBrowsePage from '@/pages/SourceBrowsePage'
import MangaDetailPage from '@/pages/MangaDetailPage'
import ReaderPage from '@/pages/ReaderPage'
import HistoryPage from '@/pages/HistoryPage'
import UpdatesPage from '@/pages/UpdatesPage'
import DownloadsPage from '@/pages/DownloadsPage'
import ExtensionsPage from '@/pages/ExtensionsPage'
import SettingsPage from '@/pages/SettingsPage'
import StatsPage from '@/pages/StatsPage'

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Reader is fullscreen — no layout */}
        <Route path="/manga/:mangaId/chapter/:chapterId" element={<ReaderPage />} />

        {/* All other pages use the sidebar layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<LibraryPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/source/:sourceId" element={<SourceBrowsePage />} />
          <Route path="/manga/:mangaId" element={<MangaDetailPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/updates" element={<UpdatesPage />} />
          <Route path="/downloads" element={<DownloadsPage />} />
          <Route path="/extensions" element={<ExtensionsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}
