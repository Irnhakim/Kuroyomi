import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

export type Language = 'en' | 'id';

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation / Layout
    'nav.library': 'Library',
    'nav.browse': 'Browse',
    'nav.updates': 'Updates',
    'nav.history': 'History',
    'nav.settings': 'Settings',
    'theme.toggle.dark': 'Switch to Dark Mode',
    'theme.toggle.light': 'Switch to Light Mode',
    'footer.text': 'KUROYOMI © 2026 • Powered by Suwayomi Server',

    // Login
    'login.welcome': 'Welcome to Kuroyomi!',
    'login.join': 'Join',
    'login.title.login': 'Welcome',
    'login.title.register': 'Kuroyomi',
    'login.desc.login': 'Login to your personal comic vault.',
    'login.desc.register': 'Create a new account to start reading.',
    'login.error.empty': 'Please fill all fields!',
    'login.success.login': 'Welcome back, {username}!',
    'login.success.register': 'Registration successful! Please login.',
    'login.btn.login': 'LOG IN',
    'login.btn.register': 'REGISTER',
    'login.btn.guest': 'LOGIN AS GUEST',
    'login.divider.or': 'OR',
    'login.btn.processing': 'Processing...',
    'login.link.register': "Don't have an account? Register now!",
    'login.link.login': 'Already have an account? Login here!',
    'login.recovery.forgot_password_title': 'Forgot Password',
    'login.recovery.forgot_username_title': 'Forgot Username',
    'login.recovery.reset_password_title': 'Reset Password',
    'login.recovery.forgot_password_desc': 'Enter your username or email to receive a verification code.',
    'login.recovery.forgot_username_desc': 'Enter your registered email to see your list of usernames.',
    'login.recovery.reset_password_desc': 'Enter the 6-digit verification code sent to your email and set a new password.',
    'login.recovery.code_sent': 'A 6-digit verification code has been sent to your email. Please also check your spam folder.',
    'login.recovery.reset_success': 'Your password has been successfully reset. Please log in.',
    'login.recovery.username_sent': 'Your username(s) have been sent to your email.',
    'login.label.email_optional': 'Email (Optional)',
    'login.link.back_login': 'Back to Login Page',
    'login.btn.send_code': 'Send Verification Code',
    'login.btn.recover_username': 'Recover Username',
    'login.label.identity': 'Username / Email',
    'login.label.registered_email': 'Registered Email',
    'login.label.verification_code': 'Verification Code (6-Digit)',
    'login.label.new_password': 'New Password',
    'settings.account.email_title': 'Email Address',
    'settings.account.email_change_confirm': 'Do you want to change your registered email address?',
    'settings.account.email_success': 'Email updated successfully.',
    'settings.account.email_btn_save': 'Save Email',
    'settings.account.email_btn_change': 'Change Email',

    // Library
    'library.title': 'Library',
    'library.subtitle': 'Your personal comic vault, synchronized locally.',
    'library.refresh': 'Refresh Library',
    'library.refreshing': 'Refreshing...',
    'library.all': 'All Manga',
    'library.search': 'Search library...',
    'library.loading': 'LOADING VAULT...',
    'library.error': 'ERROR DETECTED!',
    'library.empty.search': 'No comic matches your search query!',
    'library.empty.desc': "You don't have any manga in this category. Go to the 'Browse' tab to search online sources and add them to your library!",
    'library.manga.done': 'DONE',
    'library.manga.unknown_author': 'Unknown Author',
    'category.reading': 'Reading',
    'category.completed': 'Completed',
    'library.add_category': 'Add Category',
    'library.add_category.placeholder': 'Category name...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'library.delete_category': 'Delete category',
    'library.assign_category': 'Assign category',
    'library.sort': 'Sort',
    'library.sort.direction': 'Direction',
    'library.sort.asc': 'Ascending',
    'library.sort.desc': 'Descending',
    'library.sort.unread': 'Unread chapters',
    'library.sort.total': 'Total chapters',
    'library.sort.az': 'A-Z',
    'library.sort.added': 'Recently added',
    'library.sort.read': 'Recently read',
    'library.sort.fetched': 'Latest fetched chapter',
    'library.sort.uploaded': 'Latest uploaded chapter',
    'library.sort.random': 'Random',

    // Browse
    'browse.title': 'Browse',
    'browse.subtitle': 'Explore extension sources and find new titles.',
    'browse.search.manga': 'Search manga...',
    'browse.search.source': 'Search sources...',
    'browse.btn.install': 'Install',
    'browse.btn.uninstall': 'Uninstall',
    'browse.btn.in_library': 'In Library',
    'browse.btn.add_library': 'Add to Library',
    'browse.btn.remove_library': 'In Library (Click to remove)',
    'browse.state.loading_extensions': 'LOADING EXTENSIONS...',
    'browse.state.loading_manga': 'LOADING MANGA...',
    'browse.status.latest': 'LATEST',
    'browse.status.search': 'SEARCH',
    'browse.extensions': 'Extensions',
    'browse.sources': 'Sources',
    'browse.no_extensions': 'No extensions installed. Visit Settings to add repository URLs.',
    'browse.installed': 'Installed',
    'browse.available': 'Available',

    // History
    'history.title': 'History',
    'history.title_prefix': 'Reading',
    'history.title_suffix': 'History',
    'history.subtitle': "Keep track of what you've read recently.",
    'history.btn.resume': 'Resume',
    'history.state.loading': 'LOADING HISTORY...',
    'history.empty': 'No reading history yet. Start reading some comics!',
    'history.chapter_prefix': 'Chapter',
    'history.page_suffix': 'Page',

    // Updates
    'updates.title': 'Library Updates',
    'updates.title_prefix': 'Library',
    'updates.title_suffix': 'Updates',
    'updates.subtitle': 'Recent chapters from your library.',
    'updates.state.loading': 'LOADING UPDATES...',
    'updates.empty': 'No library updates yet. Try adding some comics to your library and check for updates.',
    'updates.btn.refresh': 'Check for Updates',
    'updates.refreshing': 'Checking for Updates...',
    'updates.refresh_started': 'Library update started in the background!',
    'updates.date.today': 'Today',
    'updates.date.yesterday': 'Yesterday',
    'updates.date.days_ago': '{count} days ago',
    'updates.show_more': 'SHOW {count} MORE CHAPTERS',
    'updates.hide_chapters': 'HIDE CHAPTERS',

    // Manga Detail
    'detail.chapters': 'Chapters',
    'detail.status': 'Status',
    'detail.author': 'Author',
    'detail.genre': 'Genre',
    'detail.chapters_list': 'Chapters List',
    'detail.state.loading': 'LOADING MANGA...',
    'detail.btn.resume': 'Resume',
    'detail.btn.start': 'Start Reading',
    'detail.btn.add_library': 'Add to Library',
    'detail.btn.in_library': 'In Library',

    // Reader
    'reader.btn.prev': 'Prev',
    'reader.btn.next': 'Next',
    'reader.btn.back': 'Back',
    'reader.btn.webtoon': 'Webtoon',
    'reader.btn.paged': 'Single Page',
    'reader.state.loading': 'LOADING CHAPTER...',
    'reader.state.no_pages': 'No pages found for this chapter.',

    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your server connection, user account, reader defaults, and source repositories.',
    'settings.account.title': 'Manage Account',
    'settings.account.logout': 'Log Out',
    'settings.account.logout_confirm': 'Are you sure you want to log out?',
    'settings.account.guest_notice': 'GUEST MODE ACTIVE: All your reading data (Library, History, and Progress) is stored entirely in this local browser and is not synchronized to the server. Create an account to synchronize data across devices.',
    'settings.password.title': 'Change Password',
    'settings.password.success': 'Password changed successfully!',
    'settings.password.label.old': 'Old Password',
    'settings.password.label.new': 'New Password',
    'settings.password.label.confirm': 'Confirm New Password',
    'settings.password.btn.save': 'Save New Password',
    'settings.danger.title': 'Danger Zone',
    'settings.danger.btn.delete': 'Delete Account',
    'settings.danger.warn': 'WARNING: Deleting your account will permanently remove all library, history, and local data!',
    'settings.danger.confirm_placeholder': 'Enter Password to Confirm',
    'settings.danger.btn.confirm_delete': 'Confirm Delete Account',
    'settings.danger.btn.cancel': 'Cancel',
    'settings.danger.alert_confirm': 'This action is permanent. All library and history data will be deleted. Continue deleting account?',
    'settings.danger.success': 'Your account has been deleted.',
    'settings.general.title': 'Reading & General Settings',
    'settings.general.lang': 'Application Language',
    'settings.general.mode': 'Default Reading Mode',
    'settings.general.mode.paged': 'Single Page (Page by Page)',
    'settings.general.mode.webtoon': 'Webtoon (Vertical Scroll)',
    'settings.general.theme': 'Application Theme',
    'settings.general.theme.light': 'Light Mode (Tokyo Night Day)',
    'settings.general.theme.dark': 'Dark Mode (Tokyo Night Classic)',
    'settings.general.fullscreen': 'Fullscreen Mode',
    'settings.general.fullscreen.desc': '(Recommended for mobile / smartphones)',
    'settings.general.fullscreen.off': 'Off / Disabled',
    'settings.general.fullscreen.reading': 'Only when reading manga',
    'settings.general.fullscreen.always': 'Always active',
    'settings.general.btn.save': 'Save Configurations',
    'settings.general.success': 'Saved Successfully!',
    'settings.server.title': 'Kuroyomi Server',
    'settings.server.status': 'Status',
    'settings.server.refresh': 'Refresh Status',
    'settings.about.title': 'About Kuroyomi',
    'settings.about.desc': 'Kuroyomi is a native web client for manga readers, executing sources directly inside a local Node.js environment without heavy containers.',
    'settings.about.bullet1': '• 100% Free and Open Source',
    'settings.about.bullet2': '• Local native execution',
    'settings.about.bullet3': '• Webtoon and Single-Page Reader',
    'modal.ok': 'OK',
    'modal.cancel': 'Cancel',
    'history.remove_confirm': 'Remove this manga from history?',
    'history.clear_confirm': 'Clear all reading history? This cannot be undone.',
    'browse.uninstall_confirm': 'Uninstall this extension?',
    'settings.admin.delete_admin_error': 'Cannot delete admin account!',
    'settings.admin.delete_user_confirm': 'Are you sure you want to delete user "{username}" and all of their data?',
    'settings.admin.delete_user_error': 'Failed to delete user.',
    'settings.general.save_error': 'Failed to save settings to browser.',
    'settings.repo.add_error': 'Failed to add repository. Make sure the URL is a valid index.json or index.pb path.',
    'settings.repo.remove_confirm': 'Are you sure you want to remove this extension repository?',
    'settings.repo.remove_error': 'Failed to remove repository.',
    'reader.last_chapter': "You've reached the last chapter!",
    'reader.first_chapter': 'You are on the first chapter!',
    'modal.save': 'Save',
    'settings.admin.no_email': 'No Email',
    'settings.admin.new_password_placeholder': 'New Password (Leave empty if unchanged)',
    'settings.admin.save_success': 'User updated successfully!',
    'settings.admin.save_error': 'Failed to update user.',
    'detail.sort.latest': 'Latest',
    'detail.sort.older': 'Older',
    'detail.search_placeholder': 'Search chapters...',
    'detail.episodes_count': '{read} / {total} Chapters',
  },
  id: {
    // Navigation / Layout
    'nav.library': 'Perpustakaan',
    'nav.browse': 'Jelajahi',
    'nav.updates': 'Pembaruan',
    'nav.history': 'Riwayat',
    'nav.settings': 'Pengaturan',
    'theme.toggle.dark': 'Ubah ke Mode Gelap',
    'theme.toggle.light': 'Ubah ke Mode Terang',
    'footer.text': 'KUROYOMI © 2026 • Didukung oleh Server Suwayomi',

    // Login
    'login.welcome': 'Selamat datang di Kuroyomi!',
    'login.join': 'Bergabung',
    'login.title.login': 'Masuk',
    'login.title.register': 'Kuroyomi',
    'login.desc.login': 'Masuk ke perpustakaan komik pribadimu.',
    'login.desc.register': 'Buat akun baru untuk mulai membaca.',
    'login.error.empty': 'Harap isi semua kolom!',
    'login.success.login': 'Selamat datang kembali, {username}!',
    'login.success.register': 'Registrasi berhasil! Silakan masuk.',
    'login.btn.login': 'MASUK (LOGIN)',
    'login.btn.register': 'DAFTAR (REGISTER)',
    'login.btn.guest': 'MASUK SEBAGAI TAMU',
    'login.divider.or': 'ATAU',
    'login.btn.processing': 'Memproses...',
    'login.link.register': 'Belum punya akun? Daftar sekarang!',
    'login.link.login': 'Sudah punya akun? Masuk di sini!',
    'login.recovery.forgot_password_title': 'Lupa Password',
    'login.recovery.forgot_username_title': 'Lupa Username',
    'login.recovery.reset_password_title': 'Reset Password',
    'login.recovery.forgot_password_desc': 'Masukkan username atau email Anda untuk menerima kode verifikasi.',
    'login.recovery.forgot_username_desc': 'Masukkan email terdaftar Anda untuk melihat daftar username.',
    'login.recovery.reset_password_desc': 'Masukkan kode verifikasi 6-digit dari email Anda dan tentukan password baru.',
    'login.recovery.code_sent': 'Kode verifikasi 6-digit telah dikirim ke email Anda. Silakan cek juga folder spam.',
    'login.recovery.reset_success': 'Password Anda berhasil direset. Silakan login.',
    'login.recovery.username_sent': 'Username Anda telah dikirim ke email.',
    'login.label.email_optional': 'Email (Opsional)',
    'login.link.back_login': 'Kembali ke Halaman Login',
    'login.btn.send_code': 'Kirim Kode Verifikasi',
    'login.btn.recover_username': 'Pulihkan Username',
    'login.label.identity': 'Username / Email',
    'login.label.registered_email': 'Email Terdaftar',
    'login.label.verification_code': 'Kode Verifikasi (6-Digit)',
    'login.label.new_password': 'Password Baru',
    'settings.account.email_title': 'Alamat Email',
    'settings.account.email_change_confirm': 'Ingin mengubah alamat email terdaftar?',
    'settings.account.email_success': 'Email berhasil diperbarui.',
    'settings.account.email_btn_save': 'Simpan Email',
    'settings.account.email_btn_change': 'Ubah Email',

    // Library
    'library.title': 'Perpustakaan',
    'library.subtitle': 'Kubah komik pribadi Anda, disinkronkan secara lokal.',
    'library.refresh': 'Perbarui Pustaka',
    'library.refreshing': 'Memperbarui...',
    'library.all': 'Semua Manga',
    'library.search': 'Cari pustaka...',
    'library.loading': 'MEMUAT KUBAH...',
    'library.error': 'TERDETEKSI KESALAHAN!',
    'library.empty.search': 'Tidak ada komik yang cocok dengan pencarian Anda!',
    'library.empty.desc': "Anda tidak memiliki manga di kategori ini. Buka tab 'Jelajahi' untuk mencari sumber online dan tambahkan ke perpustakaan Anda!",
    'library.manga.done': 'SELESAI',
    'library.manga.unknown_author': 'Penulis Tidak Diketahui',
    'category.reading': 'Membaca',
    'category.completed': 'Selesai',
    'library.add_category': 'Tambah Kategori',
    'library.add_category.placeholder': 'Nama kategori...',
    'common.save': 'Simpan',
    'common.cancel': 'Batal',
    'library.delete_category': 'Hapus kategori',
    'library.assign_category': 'Atur kategori',
    'library.sort': 'Urutkan',
    'library.sort.direction': 'Arah',
    'library.sort.asc': 'Meningkat (Asc)',
    'library.sort.desc': 'Menurun (Desc)',
    'library.sort.unread': 'Bab belum dibaca',
    'library.sort.total': 'Total bab',
    'library.sort.az': 'A-Z',
    'library.sort.added': 'Baru ditambahkan',
    'library.sort.read': 'Terakhir dibaca',
    'library.sort.fetched': 'Bab terbaru diambil',
    'library.sort.uploaded': 'Bab terbaru diunggah',
    'library.sort.random': 'Acak',

    // Browse
    'browse.title': 'Jelajahi',
    'browse.subtitle': 'Jelajahi sumber ekstensi dan temukan judul baru.',
    'browse.search.manga': 'Cari manga...',
    'browse.search.source': 'Cari sumber...',
    'browse.btn.install': 'Pasang',
    'browse.btn.uninstall': 'Hapus',
    'browse.btn.in_library': 'Di Pustaka',
    'browse.btn.add_library': 'Tambah ke Pustaka',
    'browse.btn.remove_library': 'Di Pustaka (Klik untuk hapus)',
    'browse.state.loading_extensions': 'MEMUAT EKSTENSI...',
    'browse.state.loading_manga': 'MEMUAT MANGA...',
    'browse.status.latest': 'TERBARU',
    'browse.status.search': 'PENCARIAN',
    'browse.extensions': 'Ekstensi',
    'browse.sources': 'Sumber',
    'browse.no_extensions': 'Tidak ada ekstensi terpasang. Kunjungi Pengaturan untuk menambahkan URL repositori.',
    'browse.installed': 'Terpasang',
    'browse.available': 'Tersedia',

    // History
    'history.title': 'Riwayat',
    'history.title_prefix': 'Riwayat',
    'history.title_suffix': 'Membaca',
    'history.subtitle': 'Lacak apa yang baru saja Anda baca.',
    'history.btn.resume': 'Lanjutkan',
    'history.state.loading': 'MEMUAT RIWAYAT...',
    'history.empty': 'Belum ada riwayat membaca. Mulai membaca beberapa komik!',
    'history.chapter_prefix': 'Bab',
    'history.page_suffix': 'Halaman',

    // Updates
    'updates.title': 'Pembaruan Library',
    'updates.title_prefix': 'Pembaruan',
    'updates.title_suffix': 'Library',
    'updates.subtitle': 'Bab-bab terbaru dari perpustakaan Anda.',
    'updates.state.loading': 'MEMUAT PEMBARUAN...',
    'updates.empty': 'Belum ada pembaruan library. Coba tambahkan beberapa komik ke library Anda dan periksa pembaruan.',
    'updates.btn.refresh': 'Cek Pembaruan',
    'updates.refreshing': 'Memeriksa Pembaruan...',
    'updates.refresh_started': 'Pembaruan library dimulai di latar belakang!',
    'updates.date.today': 'Hari ini',
    'updates.date.yesterday': 'Kemarin',
    'updates.date.days_ago': '{count} hari yang lalu',
    'updates.show_more': 'TAMPILKAN {count} BAB LAGI',
    'updates.hide_chapters': 'SEMBUNYIKAN BAB',

    // Manga Detail
    'detail.chapters': 'Bab',
    'detail.status': 'Status',
    'detail.author': 'Penulis',
    'detail.genre': 'Genre',
    'detail.chapters_list': 'Daftar Bab',
    'detail.state.loading': 'MEMUAT MANGA...',
    'detail.btn.resume': 'Lanjutkan',
    'detail.btn.start': 'Mulai Membaca',
    'detail.btn.add_library': 'Tambah ke Pustaka',
    'detail.btn.in_library': 'Di Pustaka',

    // Reader
    'reader.btn.prev': 'Sebelumnya',
    'reader.btn.next': 'Selanjutnya',
    'reader.btn.back': 'Kembali',
    'reader.btn.webtoon': 'Webtoon',
    'reader.btn.paged': 'Halaman Tunggal',
    'reader.state.loading': 'MEMUAT BAB...',
    'reader.state.no_pages': 'Tidak ada halaman ditemukan untuk bab ini.',

    // Settings
    'settings.title': 'Pengaturan',
    'settings.subtitle': 'Kelola koneksi server, akun pengguna, setelan bawaan pembaca, dan repositori sumber.',
    'settings.account.title': 'Kelola Akun',
    'settings.account.logout': 'Keluar',
    'settings.account.logout_confirm': 'Apakah Anda yakin ingin keluar?',
    'settings.account.guest_notice': 'MODE TAMU AKTIF: Seluruh data membaca Anda (Library, Riwayat, dan Progres) disimpan secara penuh di dalam browser lokal ini dan tidak disinkronisasi ke server. Daftar akun untuk melakukan sinkronisasi data antar perangkat.',
    'settings.password.title': 'Ubah Password',
    'settings.password.success': 'Password berhasil diubah!',
    'settings.password.label.old': 'Password Lama',
    'settings.password.label.new': 'Password Baru',
    'settings.password.label.confirm': 'Konfirmasi Password Baru',
    'settings.password.btn.save': 'Simpan Password Baru',
    'settings.danger.title': 'Zona Bahaya',
    'settings.danger.btn.delete': 'Hapus Akun Ini',
    'settings.danger.warn': 'PERINGATAN: Menghapus akun akan membuang semua library, riwayat, dan data lokal secara permanen!',
    'settings.danger.confirm_placeholder': 'Masukkan Password untuk Konfirmasi',
    'settings.danger.btn.confirm_delete': 'Konfirmasi Hapus Akun',
    'settings.danger.btn.cancel': 'Batal',
    'settings.danger.alert_confirm': 'Tindakan ini permanen. Semua data library dan riwayat Anda akan terhapus. Lanjutkan hapus akun?',
    'settings.danger.success': 'Akun Anda berhasil dihapus.',
    'settings.general.title': 'Pengaturan Membaca & Umum',
    'settings.general.lang': 'Bahasa Aplikasi',
    'settings.general.mode': 'Mode Baca Default',
    'settings.general.mode.paged': 'Single Page (Halaman demi Halaman)',
    'settings.general.mode.webtoon': 'Webtoon (Scroll Vertikal)',
    'settings.general.theme': 'Tema Aplikasi',
    'settings.general.theme.light': 'Light Mode (Tokyo Night Day)',
    'settings.general.theme.dark': 'Dark Mode (Tokyo Night Classic)',
    'settings.general.fullscreen': 'Mode Layar Penuh',
    'settings.general.fullscreen.desc': '(Direkomendasikan untuk perangkat seluler / smartphone)',
    'settings.general.fullscreen.off': 'Off / Tidak Aktif',
    'settings.general.fullscreen.reading': 'Saat sedang membaca komik saja',
    'settings.general.fullscreen.always': 'Selalu aktif',
    'settings.general.btn.save': 'Simpan Konfigurasi',
    'settings.general.success': 'Berhasil Disimpan!',
    'settings.server.title': 'Server Kuroyomi',
    'settings.server.status': 'Status',
    'settings.server.refresh': 'Segarkan Status',
    'settings.about.title': 'Tentang Kuroyomi',
    'settings.about.desc': 'Kuroyomi adalah klien web asli untuk pembaca manga, mengeksekusi sumber secara langsung di dalam lingkungan Node.js lokal tanpa kontainer berat.',
    'settings.about.bullet1': '• 100% Gratis dan Sumber Terbuka',
    'settings.about.bullet2': '• Eksekusi lokal asli',
    'settings.about.bullet3': '• Pembaca Webtoon dan Single-Page',
    'modal.ok': 'OK',
    'modal.cancel': 'Batal',
    'history.remove_confirm': 'Hapus manga ini dari riwayat?',
    'history.clear_confirm': 'Hapus semua riwayat membaca? Tindakan ini tidak dapat dibatalkan.',
    'browse.uninstall_confirm': 'Hapus instalasi ekstensi ini?',
    'settings.admin.delete_admin_error': 'Tidak dapat menghapus akun admin!',
    'settings.admin.delete_user_confirm': 'Apakah Anda yakin ingin menghapus pengguna "{username}" beserta seluruh datanya?',
    'settings.admin.delete_user_error': 'Gagal menghapus pengguna.',
    'settings.general.save_error': 'Gagal menyimpan pengaturan ke browser.',
    'settings.repo.add_error': 'Gagal menambahkan repositori. Pastikan URL merupakan path index.json atau index.pb yang valid.',
    'settings.repo.remove_confirm': 'Apakah Anda yakin ingin menghapus repositori ekstensi ini?',
    'settings.repo.remove_error': 'Gagal menghapus repositori.',
    'reader.last_chapter': 'Anda telah mencapai bab terakhir!',
    'reader.first_chapter': 'Anda berada di bab pertama!',
    'modal.save': 'Simpan',
    'settings.admin.no_email': 'Tanpa Email',
    'settings.admin.new_password_placeholder': 'Password Baru (Kosongkan jika tidak diubah)',
    'settings.admin.save_success': 'Pengguna berhasil diperbarui!',
    'settings.admin.save_error': 'Gagal memperbarui pengguna.',
    'detail.sort.latest': 'Terbaru',
    'detail.sort.older': 'Terlama',
    'detail.search_placeholder': 'Cari episode...',
    'detail.episodes_count': '{read} / {total} Chapter',
  }
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Initial fetch from localStorage
    const saved = localStorage.getItem('lang') as Language;
    if (saved === 'en' || saved === 'id') {
      setLanguageState(saved);
    } else {
      // Check user prefix settings
      api.getSettings().then(configs => {
        if (configs.lang === 'en' || configs.lang === 'id') {
          setLanguageState(configs.lang);
        }
      }).catch(() => { });
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('lang', lang);
    api.updateSettings({ lang }).catch(() => { });
  };

  const t = (key: string, replacements?: Record<string, string>): string => {
    const langDict = translations[language] || translations.en;
    let translation = langDict[key] || translations.en[key] || key;

    if (replacements) {
      Object.entries(replacements).forEach(([k, val]) => {
        translation = translation.replace(`{${k}}`, val);
      });
    }

    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
