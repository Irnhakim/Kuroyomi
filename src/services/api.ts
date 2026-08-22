import { auth } from './auth';

const isDev = window.location.port === '5173' || window.location.port === '5174';
const SERVER_ORIGIN = isDev ? `${window.location.protocol}//${window.location.hostname}:4567` : window.location.origin;

const BASE_URL = `${SERVER_ORIGIN}/api/v1`;
const GRAPHQL_URL = `${SERVER_ORIGIN}/graphql`;

export interface Extension {
  name: string;
  pkgName: string;
  versionName: string;
  versionCode: number;
  lang: string;
  isNsfw: boolean;
  status: 'INSTALLED' | 'AVAILABLE';
  iconUrl?: string;
  installed?: boolean;
}

export interface Source {
  id: string;
  name: string;
  lang: string;
  supportsLatest: boolean;
  isConfigurable: boolean;
  iconUrl?: string;
}

export interface HistoryItem {
  mangaId: number;
  mangaTitle: string;
  mangaThumbnail: string;
  chapterId: number;
  chapterName: string;
  currentPage: number;
  pageCount: number;
  readAt: number;
}

export interface Manga {
  id: number;
  url: string;
  title: string;
  artist?: string;
  author?: string;
  description?: string;
  genre?: string[];
  status: string;
  thumbnailUrl: string;
  initialized: boolean;
  inLibrary: boolean;
  sourceId: string;
}

export interface Chapter {
  id: number; // Suwayomi chapter indexes can act as ID
  url: string;
  name: string;
  chapterNumber: number;
  read: boolean;
  bookmark: boolean;
  lastPageRead: number;
  dateUpload: number;
  sourceOrder: number;
  downloaded: boolean;
}

export interface Category {
  id: number;
  name: string;
  order: number;
}

// Helper for GraphQL queries on Suwayomi-Server
async function graphqlRequest(query: string, variables?: any) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok) throw new Error(`GraphQL Error: ${res.statusText}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e: any) => e.message).join('; '));
  return json.data;
}

// Helper to get localstorage key prefix for current user
const getUserPrefix = () => {
  const user = auth.getCurrentUser();
  return user ? `kuroyomi_user_${user.toLowerCase()}` : 'kuroyomi_guest';
};

// Helper for user-isolated extensions
const getUserInstalledExtensions = (): Set<string> => {
  const prefix = getUserPrefix();
  const val = localStorage.getItem(`${prefix}_installed_extensions`);
  return new Set(val ? JSON.parse(val) : []);
};

const saveUserInstalledExtensions = (exts: Set<string>) => {
  const prefix = getUserPrefix();
  localStorage.setItem(`${prefix}_installed_extensions`, JSON.stringify(Array.from(exts)));
};

export const syncUserDataToServer = async (): Promise<void> => {
  const user = auth.getCurrentUser();
  if (!user) return;
  const key = user.toLowerCase();
  const data = {
    library: localStorage.getItem(`kuroyomi_user_${key}_library`),
    progress: localStorage.getItem(`kuroyomi_user_${key}_progress`),
    categories: localStorage.getItem(`kuroyomi_user_${key}_categories`),
    settings: localStorage.getItem(`kuroyomi_user_${key}_settings`),
    installed_extensions: localStorage.getItem(`kuroyomi_user_${key}_installed_extensions`),
    manga_categories: localStorage.getItem(`kuroyomi_user_${key}_manga_categories`),
  };
  try {
    await fetch(`${BASE_URL}/kuroyomi/user/${key}/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.warn("Failed to sync user data to server", e);
  }
};

export const api = {
  // Asset URLs directly connecting to Suwayomi REST endpoints
  getMangaThumbnailUrl: (mangaIdOrManga: number | Manga) => {
    const id = typeof mangaIdOrManga === 'number' ? mangaIdOrManga : mangaIdOrManga.id;
    return `${BASE_URL}/manga/${id}/thumbnail`;
  },
  getExtensionIconUrl: (pkgName: string) => `${BASE_URL}/extension/icon/${pkgName}`,
  getSourceIconUrl: (source: Source) => {
    if (source.id === '0' || source.name.toLowerCase() === 'local source') {
      return '/logo.svg';
    }
    if (source.iconUrl) {
      const parts = source.iconUrl.split('/extension/icon/');
      const pkgName = parts.length > 1 ? parts[1] : null;
      if (pkgName) {
        return `${SERVER_ORIGIN}/api/v1/extension/icon/${pkgName}`;
      }
    }
    return '/logo.svg';
  },
  getPageImageUrl: (mangaId: number, chapterIndex: number, pageIndex: number) =>
    `${BASE_URL}/manga/${mangaId}/chapter/${chapterIndex}/page/${pageIndex}`,

  // Extension API
  getExtensions: async (): Promise<Extension[]> => {
    const res = await fetch(`${BASE_URL}/extension/list`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const exts: Extension[] = await res.json();
    const installedSet = getUserInstalledExtensions();

    return exts.map(ext => ({
      ...ext,
      status: installedSet.has(ext.pkgName) ? 'INSTALLED' : 'AVAILABLE'
    }));
  },

  installExtension: async (pkgName: string): Promise<void> => {
    // 1. Check if the extension is already installed on the backend server
    const resList = await fetch(`${BASE_URL}/extension/list`);
    if (resList.ok) {
      const serverExts: Extension[] = await resList.json();
      const match = serverExts.find(e => e.pkgName === pkgName);
      if (match && match.installed) {
        const installedSet = getUserInstalledExtensions();
        installedSet.add(pkgName);
        saveUserInstalledExtensions(installedSet);
        await syncUserDataToServer();
        return;
      }
    }

    // 2. Otherwise call backend to install
    const res = await fetch(`${BASE_URL}/extension/install/${pkgName}`);
    if (!res.ok) {
      let msg = `Gagal menginstal ekstensi (${res.status})`;
      try {
        const text = await res.text();
        if (text) msg = text;
      } catch (_) {}
      throw new Error(msg);
    }
    const installedSet = getUserInstalledExtensions();
    installedSet.add(pkgName);
    saveUserInstalledExtensions(installedSet);
    await syncUserDataToServer();
  },

  uninstallExtension: async (pkgName: string): Promise<void> => {
    const installedSet = getUserInstalledExtensions();
    installedSet.delete(pkgName);
    saveUserInstalledExtensions(installedSet);

    // Check if other users are using it
    let usernames: string[] = [];
    try {
      const res = await fetch(`${BASE_URL}/kuroyomi/users`);
      if (res.ok) {
        const usersObj = await res.json();
        usernames = Object.values(usersObj).map((u: any) => u.username);
      }
    } catch (e) {
      console.warn("Failed to fetch usernames from server during uninstall check, using local fallback", e);
      usernames = auth.getRegisteredUsernames();
    }

    const currentUsername = auth.getCurrentUser()?.toLowerCase();
    const otherUsersHaveIt = usernames.some(uname => {
      const lowerUname = uname.toLowerCase();
      if (lowerUname === currentUsername) return false;
      const key = `kuroyomi_user_${lowerUname}_installed_extensions`;
      const val = localStorage.getItem(key);
      if (val) {
        const list: string[] = JSON.parse(val);
        return list.includes(pkgName);
      }
      return false;
    });

    if (!otherUsersHaveIt) {
      const res = await fetch(`${BASE_URL}/extension/uninstall/${pkgName}`);
      if (!res.ok) {
        let msg = `Gagal menghapus ekstensi (${res.status})`;
        try {
          const text = await res.text();
          if (text) msg = text;
        } catch (_) {}
        throw new Error(msg);
      }
    }
    await syncUserDataToServer();
  },

  // Sources API
  getSources: async (): Promise<Source[]> => {
    const res = await fetch(`${BASE_URL}/source/list`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const sources: Source[] = await res.json();
    const installedSet = getUserInstalledExtensions();

    return sources.filter(source => {
      if (source.id === '0' || source.name.toLowerCase() === 'local source') {
        return true;
      }
      if (!source.iconUrl) return false;
      const parts = source.iconUrl.split('/extension/icon/');
      const pkgName = parts.length > 1 ? parts[1] : null;
      return pkgName ? installedSet.has(pkgName) : false;
    });
  },

  getSourcePopular: async (sourceId: string, pageNum: number): Promise<{ mangas: Manga[]; hasNextPage: boolean }> => {
    const res = await fetch(`${BASE_URL}/source/${sourceId}/popular/${pageNum}`);
    if (!res.ok) {
      let msg = `Gagal memuat catalog populer (${res.status})`;
      try {
        const text = await res.text();
        if (text) msg = text;
      } catch (_) {}
      throw new Error(msg);
    }
    const data = await res.json();
    const mangas: Manga[] = data.mangaList || data.mangas || (Array.isArray(data) ? data : []);

    // Overlay user library status
    const prefix = getUserPrefix();
    const listJson = localStorage.getItem(`${prefix}_library`);
    const list: Manga[] = listJson ? JSON.parse(listJson) : [];
    const libraryIds = new Set(list.map(m => m.id));

    const mapped = mangas.map(m => ({
      ...m,
      inLibrary: libraryIds.has(m.id)
    }));

    return {
      mangas: mapped,
      hasNextPage: data.hasNextPage ?? false,
    };
  },

  getSourceLatest: async (sourceId: string, pageNum: number): Promise<{ mangas: Manga[]; hasNextPage: boolean }> => {
    const res = await fetch(`${BASE_URL}/source/${sourceId}/latest/${pageNum}`);
    if (!res.ok) {
      let msg = `Gagal memuat catalog terbaru (${res.status})`;
      try {
        const text = await res.text();
        if (text) msg = text;
      } catch (_) {}
      throw new Error(msg);
    }
    const data = await res.json();
    const mangas: Manga[] = data.mangaList || data.mangas || (Array.isArray(data) ? data : []);

    // Overlay user library status
    const prefix = getUserPrefix();
    const listJson = localStorage.getItem(`${prefix}_library`);
    const list: Manga[] = listJson ? JSON.parse(listJson) : [];
    const libraryIds = new Set(list.map(m => m.id));

    const mapped = mangas.map(m => ({
      ...m,
      inLibrary: libraryIds.has(m.id)
    }));

    return {
      mangas: mapped,
      hasNextPage: data.hasNextPage ?? false,
    };
  },

  searchSource: async (sourceId: string, query: string, pageNum: number): Promise<{ mangas: Manga[]; hasNextPage: boolean }> => {
    const res = await fetch(`${BASE_URL}/source/${sourceId}/search?query=${encodeURIComponent(query)}&pageNum=${pageNum}`);
    if (!res.ok) {
      let msg = `Gagal mencari catalog (${res.status})`;
      try {
        const text = await res.text();
        if (text) msg = text;
      } catch (_) {}
      throw new Error(msg);
    }
    const data = await res.json();
    const mangas: Manga[] = data.mangaList || data.mangas || (Array.isArray(data) ? data : []);

    // Overlay user library status
    const prefix = getUserPrefix();
    const listJson = localStorage.getItem(`${prefix}_library`);
    const list: Manga[] = listJson ? JSON.parse(listJson) : [];
    const libraryIds = new Set(list.map(m => m.id));

    const mapped = mangas.map(m => ({
      ...m,
      inLibrary: libraryIds.has(m.id)
    }));

    return {
      mangas: mapped,
      hasNextPage: data.hasNextPage ?? false,
    };
  },

  getSourceFilters: async (sourceId: string, reset = false): Promise<any[]> => {
    const res = await fetch(`${BASE_URL}/source/${sourceId}/filters?reset=${reset}`);
    if (!res.ok) throw new Error(`Failed to fetch source filters (${res.status})`);
    return res.json();
  },

  searchSourceWithFilters: async (sourceId: string, query: string, pageNum: number, filters: any[]): Promise<{ mangas: Manga[]; hasNextPage: boolean }> => {
    const res = await fetch(`${BASE_URL}/source/${sourceId}/search/${pageNum}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchTerm: query || null,
        filter: filters
      })
    });
    if (!res.ok) {
      let msg = `Gagal mencari dengan filter (${res.status})`;
      try {
        const text = await res.text();
        if (text) msg = text;
      } catch (_) {}
      throw new Error(msg);
    }
    const data = await res.json();
    const mangas: Manga[] = data.mangaList || data.mangas || (Array.isArray(data) ? data : []);

    const prefix = getUserPrefix();
    const listJson = localStorage.getItem(`${prefix}_library`);
    const list: Manga[] = listJson ? JSON.parse(listJson) : [];
    const libraryIds = new Set(list.map(m => m.id));

    const mapped = mangas.map(m => ({
      ...m,
      inLibrary: libraryIds.has(m.id)
    }));

    return {
      mangas: mapped,
      hasNextPage: data.hasNextPage ?? false,
    };
  },

  // Manga Details
  getMangaDetails: async (mangaId: number): Promise<Manga> => {
    const res = await fetch(`${BASE_URL}/manga/${mangaId}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const manga: Manga = await res.json();

    // Overlay user library status
    const prefix = getUserPrefix();
    const listJson = localStorage.getItem(`${prefix}_library`);
    const list: Manga[] = listJson ? JSON.parse(listJson) : [];
    manga.inLibrary = list.some(m => m.id === manga.id);

    return manga;
  },

  getMangaDetailsFull: async (mangaId: number): Promise<Manga> => {
    const res = await fetch(`${BASE_URL}/manga/${mangaId}/full`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const manga: Manga = await res.json();

    // Overlay user library status
    const prefix = getUserPrefix();
    const listJson = localStorage.getItem(`${prefix}_library`);
    const list: Manga[] = listJson ? JSON.parse(listJson) : [];
    manga.inLibrary = list.some(m => m.id === manga.id);

    return manga;
  },

  getMangaChapters: async (mangaId: number): Promise<Chapter[]> => {
    const res = await fetch(`${BASE_URL}/manga/${mangaId}/chapters`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const list: any[] = await res.json();

    // Overlay user reading progress
    const prefix = getUserPrefix();
    const progressJson = localStorage.getItem(`${prefix}_progress`);
    const progress = progressJson ? JSON.parse(progressJson) : {};

    return list.map((ch) => {
      const key = `${mangaId}_${ch.index}`;
      const userProgress = progress[key] || {};

      return {
        id: ch.index, // Use index as ID to match REST chapterIndex parameter
        url: ch.url,
        name: ch.name,
        chapterNumber: ch.chapterNumber,
        read: userProgress.read !== undefined ? userProgress.read : ch.read,
        bookmark: ch.bookmark,
        lastPageRead: userProgress.lastPageRead !== undefined ? userProgress.lastPageRead : ch.lastPageRead,
        dateUpload: ch.dateUpload || 0,
        sourceOrder: ch.index,
        downloaded: ch.downloadStatus === 'DOWNLOADED'
      };
    });
  },

  // Library Actions (Multi-user per user storage override)
  addToLibrary: async (mangaId: number): Promise<void> => {
    // Notify backend so it compiles source data
    try {
      await fetch(`${BASE_URL}/manga/${mangaId}/library`);
    } catch (e) {
      console.warn("Backend library sync skipped:", e);
    }

    const manga = await api.getMangaDetailsFull(mangaId);
    const prefix = getUserPrefix();
    const listJson = localStorage.getItem(`${prefix}_library`);
    const list: Manga[] = listJson ? JSON.parse(listJson) : [];

    if (!list.some(m => m.id === manga.id)) {
      list.push({ ...manga, inLibrary: true });
      localStorage.setItem(`${prefix}_library`, JSON.stringify(list));
      await syncUserDataToServer();
    }
  },

  removeFromLibrary: async (mangaId: number): Promise<void> => {
    try {
      await fetch(`${BASE_URL}/manga/${mangaId}/library`, { method: 'DELETE' });
    } catch (e) {
      console.warn("Backend library sync skipped:", e);
    }

    const prefix = getUserPrefix();
    const listJson = localStorage.getItem(`${prefix}_library`);
    if (listJson) {
      const list: Manga[] = JSON.parse(listJson);
      const newList = list.filter(m => m.id !== mangaId);
      localStorage.setItem(`${prefix}_library`, JSON.stringify(newList));
      await syncUserDataToServer();
    }
  },

  // Categories & Library Management
  getCategories: async (): Promise<Category[]> => {
    const prefix = getUserPrefix();
    const catsJson = localStorage.getItem(`${prefix}_categories`);
    if (catsJson) {
      return JSON.parse(catsJson);
    }

    const defaultCats: Category[] = [
      { id: 1, name: 'Membaca', order: 0 },
      { id: 2, name: 'Selesai', order: 1 }
    ];
    localStorage.setItem(`${prefix}_categories`, JSON.stringify(defaultCats));
    return defaultCats;
  },

  getCategoryMangas: async (categoryId: number): Promise<Manga[]> => {
    const prefix = getUserPrefix();
    const mapJson = localStorage.getItem(`${prefix}_manga_categories`);
    const map = mapJson ? JSON.parse(mapJson) : {};

    const library = await api.getLibrary();
    // Default to the first category if manga has no category assigned yet
    return library.filter(m => {
      const mangaCatId = map[m.id] || 1; // Default to category ID 1
      return mangaCatId === categoryId;
    });
  },

  getLibrary: async (): Promise<Manga[]> => {
    const prefix = getUserPrefix();
    const listJson = localStorage.getItem(`${prefix}_library`);
    return listJson ? JSON.parse(listJson) : [];
  },

  setMangaCategory: async (mangaId: number, categoryId: number): Promise<void> => {
    const prefix = getUserPrefix();
    const mapJson = localStorage.getItem(`${prefix}_manga_categories`);
    const map = mapJson ? JSON.parse(mapJson) : {};
    map[mangaId] = categoryId;
    localStorage.setItem(`${prefix}_manga_categories`, JSON.stringify(map));
    await syncUserDataToServer();
  },

  addCategory: async (name: string): Promise<Category[]> => {
    const prefix = getUserPrefix();
    const cats = await api.getCategories();
    const nextId = cats.length > 0 ? Math.max(...cats.map(c => c.id)) + 1 : 1;
    cats.push({ id: nextId, name, order: cats.length });
    localStorage.setItem(`${prefix}_categories`, JSON.stringify(cats));
    await syncUserDataToServer();
    return cats;
  },

  deleteCategory: async (id: number): Promise<Category[]> => {
    const prefix = getUserPrefix();
    const cats = await api.getCategories();
    const updated = cats.filter(c => c.id !== id);
    localStorage.setItem(`${prefix}_categories`, JSON.stringify(updated));

    // Cleanup manga category mappings that used this category
    const mapJson = localStorage.getItem(`${prefix}_manga_categories`);
    if (mapJson) {
      const map = JSON.parse(mapJson);
      for (const mangaId in map) {
        if (map[mangaId] === id) {
          delete map[mangaId];
        }
      }
      localStorage.setItem(`${prefix}_manga_categories`, JSON.stringify(map));
    }

    await syncUserDataToServer();
    return updated;
  },

  // Chapter Details & Pages
  getChapterDetails: async (mangaId: number, chapterIndex: number): Promise<any> => {
    const res = await fetch(`${BASE_URL}/manga/${mangaId}/chapter/${chapterIndex}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const details = await res.json();

    const prefix = getUserPrefix();
    const progressJson = localStorage.getItem(`${prefix}_progress`);
    const progress = progressJson ? JSON.parse(progressJson) : {};
    const key = `${mangaId}_${chapterIndex}`;
    const userProgress = progress[key] || {};

    if (userProgress.lastPageRead !== undefined) {
      details.lastPageRead = userProgress.lastPageRead;
    }
    if (userProgress.read !== undefined) {
      details.read = userProgress.read;
    }

    return details;
  },

  markChapterRead: async (mangaId: number, chapterIndex: number, read: boolean): Promise<void> => {
    try {
      await fetch(`${BASE_URL}/manga/${mangaId}/chapter/${chapterIndex}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `read=${read}`
      });
    } catch (e) {
      console.warn("Backend chapter read status sync skipped:", e);
    }

    const prefix = getUserPrefix();
    const progressJson = localStorage.getItem(`${prefix}_progress`);
    const progress = progressJson ? JSON.parse(progressJson) : {};
    const key = `${mangaId}_${chapterIndex}`;

    if (!progress[key]) progress[key] = {};
    progress[key].read = read;
    localStorage.setItem(`${prefix}_progress`, JSON.stringify(progress));
    await syncUserDataToServer();
  },

  updateProgress: async (mangaId: number, chapterIndex: number, lastPageRead: number): Promise<void> => {
    try {
      await fetch(`${BASE_URL}/manga/${mangaId}/chapter/${chapterIndex}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `lastPageRead=${lastPageRead}`
      });
    } catch (e) {
      console.warn("Backend chapter progress sync skipped:", e);
    }

    const prefix = getUserPrefix();
    const progressJson = localStorage.getItem(`${prefix}_progress`);
    const progress = progressJson ? JSON.parse(progressJson) : {};
    const key = `${mangaId}_${chapterIndex}`;

    if (!progress[key]) progress[key] = {};
    progress[key].lastPageRead = lastPageRead;
    localStorage.setItem(`${prefix}_progress`, JSON.stringify(progress));
    await syncUserDataToServer();
  },

  // Settings Management (LocalStorage for frontend specs + GraphQL for backend specs)
  getSettings: async (): Promise<Record<string, any>> => {
    const prefix = getUserPrefix();
    const settingsJson = localStorage.getItem(`${prefix}_settings`);
    if (settingsJson) {
      return JSON.parse(settingsJson);
    }

    const localReaderMode = localStorage.getItem('readerMode') || 'webtoon';
    const localTheme = localStorage.getItem('theme') || 'light';

    let extensionRepoUrls: string[] = [];
    try {
      const data = await graphqlRequest(`
        query {
          extensionStores {
            nodes {
              indexUrl
            }
          }
        }
      `);
      extensionRepoUrls = (data?.extensionStores?.nodes || []).map((n: any) => n.indexUrl);
    } catch (e) {
      console.warn("Failed to load repo settings from GraphQL", e);
    }

    const defaultSettings = {
      readerMode: localReaderMode,
      theme: localTheme,
      extensionRepoUrls
    };

    localStorage.setItem(`${prefix}_settings`, JSON.stringify(defaultSettings));
    return defaultSettings;
  },

  updateSettings: async (settings: Record<string, string>): Promise<void> => {
    const prefix = getUserPrefix();
    const currentSettings = await api.getSettings();
    const updated = { ...currentSettings, ...settings };
    localStorage.setItem(`${prefix}_settings`, JSON.stringify(updated));

    if (settings.readerMode) localStorage.setItem('readerMode', settings.readerMode);
    if (settings.theme) localStorage.setItem('theme', settings.theme);
    await syncUserDataToServer();
  },

  addExtensionStore: async (url: string): Promise<void> => {
    await graphqlRequest(`
      mutation($input: AddExtensionStoreInput!) {
        addExtensionStore(input: $input) {
          extensionStore {
            indexUrl
          }
        }
      }
    `, {
      input: { indexUrl: url }
    });
  },

  removeExtensionStore: async (url: string): Promise<void> => {
    await graphqlRequest(`
      mutation($input: RemoveExtensionStoreInput!) {
        removeExtensionStore(input: $input) {
          clientMutationId
        }
      }
    `, {
      input: { indexUrl: url }
    });
  },

  deleteUserAccount: async (password: string): Promise<void> => {
    const user = auth.getCurrentUser();
    if (!user) throw new Error('Tidak ada sesi aktif!');
    const key = user.toLowerCase();

    // 1. Get user's installed extensions
    const installedSet = getUserInstalledExtensions();

    // 2. Call auth.deleteAccount (validates password, deletes user, removes other keys, logs out)
    await auth.deleteAccount(password);

    // 3. Clean up the user's extensions key
    localStorage.removeItem(`kuroyomi_user_${key}_installed_extensions`);

    // 4. Uninstall extensions on the backend if no other users are using them
    const usernames = auth.getRegisteredUsernames(); // Gets remaining usernames
    for (const pkgName of installedSet) {
      const otherUsersHaveIt = usernames.some(uname => {
        const lowerUname = uname.toLowerCase();
        const userKey = `kuroyomi_user_${lowerUname}_installed_extensions`;
        const val = localStorage.getItem(userKey);
        if (val) {
          const list: string[] = JSON.parse(val);
          return list.includes(pkgName);
        }
        return false;
      });

      if (!otherUsersHaveIt) {
        try {
          await fetch(`${BASE_URL}/extension/uninstall/${pkgName}`);
        } catch (e) {
          console.warn(`Failed to uninstall unused extension ${pkgName} from server:`, e);
        }
      }
    }
  },

  // Reading History Management (Per-user localStorage backup)
  getHistory: async (): Promise<HistoryItem[]> => {
    const prefix = getUserPrefix();
    const historyJson = localStorage.getItem(`${prefix}_history`);
    return historyJson ? JSON.parse(historyJson) : [];
  },

  saveHistory: async (item: Omit<HistoryItem, 'readAt'>): Promise<void> => {
    const prefix = getUserPrefix();
    const historyList = await api.getHistory();
    const updatedList = historyList.filter(
      h => !(h.mangaId === item.mangaId && h.chapterId === item.chapterId)
    );
    updatedList.unshift({
      ...item,
      readAt: Date.now()
    });
    // Limit history to top 100 entries to avoid bloating localStorage
    const limitedList = updatedList.slice(0, 100);
    localStorage.setItem(`${prefix}_history`, JSON.stringify(limitedList));
    await syncUserDataToServer();
  },

  deleteHistoryItem: async (mangaId: number, chapterId: number): Promise<void> => {
    const prefix = getUserPrefix();
    const historyList = await api.getHistory();
    const updatedList = historyList.filter(
      h => !(h.mangaId === mangaId && h.chapterId === chapterId)
    );
    localStorage.setItem(`${prefix}_history`, JSON.stringify(updatedList));
    await syncUserDataToServer();
  },

  clearHistory: async (): Promise<void> => {
    const prefix = getUserPrefix();
    localStorage.setItem(`${prefix}_history`, JSON.stringify([]));
    await syncUserDataToServer();
  }
};
