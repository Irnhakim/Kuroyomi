import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  id: {
    translation: {
      library: 'Perpustakaan',
      sources: 'Sumber',
      history: 'Riwayat',
      updates: 'Pembaruan',
      downloads: 'Unduhan',
      extensions: 'Ekstensi',
      settings: 'Pengaturan',
      stats: 'Statistik',
      addToLibrary: 'Tambah ke Perpustakaan',
      removeFromLibrary: 'Hapus dari Perpustakaan',
      startReading: 'Mulai Membaca',
      continueReading: 'Lanjutkan Membaca',
      markRead: 'Tandai Sudah Dibaca',
      markUnread: 'Tandai Belum Dibaca',
      noManga: 'Perpustakaan kosong',
      noMangaDesc: 'Jelajahi sumber dan tambahkan manga ke perpustakaan Anda.',
      browseSources: 'Jelajahi Sumber',
    },
  },
  en: {
    translation: {
      library: 'Library',
      sources: 'Sources',
      history: 'History',
      updates: 'Updates',
      downloads: 'Downloads',
      extensions: 'Extensions',
      settings: 'Settings',
      stats: 'Statistics',
      addToLibrary: 'Add to Library',
      removeFromLibrary: 'Remove from Library',
      startReading: 'Start Reading',
      continueReading: 'Continue Reading',
      markRead: 'Mark Read',
      markUnread: 'Mark Unread',
      noManga: 'Your library is empty',
      noMangaDesc: 'Browse sources and add manga to your library.',
      browseSources: 'Browse Sources',
    },
  },
  ja: {
    translation: {
      library: 'ライブラリ',
      sources: 'ソース',
      history: '履歴',
      updates: '更新',
      downloads: 'ダウンロード',
      extensions: '拡張機能',
      settings: '設定',
      stats: '統計',
      addToLibrary: 'ライブラリに追加',
      removeFromLibrary: 'ライブラリから削除',
      startReading: '読み始める',
      continueReading: '続きを読む',
      markRead: '既読にする',
      markUnread: '未読にする',
      noManga: 'ライブラリが空です',
      noMangaDesc: 'ソースを参照してマンガをライブラリに追加してください。',
      browseSources: 'ソースを参照',
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'id',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
