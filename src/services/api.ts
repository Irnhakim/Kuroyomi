const BASE_URL = 'http://localhost:3001/api/trpc';
const SERVER_ORIGIN = 'http://localhost:3001';

export interface Extension {
  name: string;
  pkgName: string;
  versionName: string;
  versionCode: number;
  lang: string;
  isNsfw: boolean;
  status: 'INSTALLED' | 'AVAILABLE';
  iconUrl?: string;
}

export interface Source {
  id: string;
  name: string;
  lang: string;
  supportsLatest: boolean;
  isConfigurable: boolean;
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
  id: number;
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

// Helpers for tRPC SuperJSON serialization/deserialization over HTTP
async function trpcQuery(path: string, input?: any) {
  let url = `${BASE_URL}/${path}`;
  if (input !== undefined) {
    url += `?input=${encodeURIComponent(JSON.stringify(input))}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`tRPC Query Error: ${res.statusText}`);
  const json = await res.json();
  return json.result.data.json;
}

async function trpcMutation(path: string, input?: any) {
  const res = await fetch(`${BASE_URL}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ json: input ?? null }),
  });
  if (!res.ok) throw new Error(`tRPC Mutation Error: ${res.statusText}`);
  const json = await res.json();
  return json.result.data.json;
}

// Proxy URL for image assets
const getProxyUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('/data/') || url.startsWith('data/')) {
    return `${SERVER_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  return `${SERVER_ORIGIN}/api/proxy?url=${encodeURIComponent(url)}`;
};

export const api = {
  // Asset URLs
  getMangaThumbnailUrl: (manga: Manga) => getProxyUrl(manga.thumbnailUrl),
  getExtensionIconUrl: (pkgName: string) => `https://raw.githubusercontent.com/keiyoushi/extensions/repo/icon/${pkgName}.png`,
  getPageImageUrl: (pageUrl: string) => getProxyUrl(pageUrl),

  // Extension API
  getExtensions: async (): Promise<Extension[]> => {
    // Merge installed and available
    const [installed, available]: [any[], any[]] = await Promise.all([
      trpcQuery('extension.installed'),
      trpcQuery('extension.available')
    ]);
    
    const allExts: Extension[] = [
      ...installed.map(e => ({
        name: e.name,
        pkgName: e.pkgName,
        versionName: e.versionName,
        versionCode: e.versionCode,
        lang: e.lang,
        isNsfw: e.isNsfw,
        status: 'INSTALLED' as const,
        iconUrl: e.iconUrl
      })),
      ...available
        .filter(av => !installed.some(ins => ins.pkgName === av.pkgName))
        .map(e => ({
          name: e.name,
          pkgName: e.pkgName,
          versionName: e.versionName,
          versionCode: e.versionCode,
          lang: e.lang,
          isNsfw: e.isNsfw,
          status: 'AVAILABLE' as const,
          iconUrl: e.iconUrl
        }))
    ];
    return allExts;
  },
  
  installExtension: async (pkgName: string): Promise<void> => {
    await trpcMutation('extension.install', { pkgName });
  },
  
  uninstallExtension: async (pkgName: string): Promise<void> => {
    await trpcMutation('extension.uninstall', { pkgName });
  },

  // Sources API
  getSources: async (): Promise<Source[]> => {
    const list: any[] = await trpcQuery('source.all');
    return list.map(s => ({
      id: s.id,
      name: s.name,
      lang: s.lang,
      supportsLatest: true,
      isConfigurable: false
    }));
  },
  
  getSourcePopular: async (sourceId: string, page: number): Promise<{ mangas: Manga[]; hasNextPage: boolean }> => {
    const data = await trpcQuery('source.popular', { sourceId, page });
    // tRPC returns { mangas: [...], hasNextPage: boolean }
    const mangasMapped = (data.mangas || []).map((m: any) => ({
      id: m.id ?? 0,
      url: m.url,
      title: m.title,
      artist: m.artist,
      author: m.author,
      description: m.description,
      genre: m.genre ? m.genre.split(',').map((s: string) => s.trim()) : [],
      status: m.status === 1 ? 'ONGOING' : m.status === 2 ? 'COMPLETED' : 'UNKNOWN',
      thumbnailUrl: m.thumbnailUrl ?? '',
      initialized: m.initialized ?? false,
      inLibrary: m.inLibrary ?? false,
      sourceId: m.sourceId
    }));
    return {
      mangas: mangasMapped,
      hasNextPage: data.hasNextPage ?? false
    };
  },

  getSourceLatest: async (sourceId: string, page: number): Promise<{ mangas: Manga[]; hasNextPage: boolean }> => {
    const data = await trpcQuery('source.latest', { sourceId, page });
    const mangasMapped = (data.mangas || []).map((m: any) => ({
      id: m.id ?? 0,
      url: m.url,
      title: m.title,
      artist: m.artist,
      author: m.author,
      description: m.description,
      genre: m.genre ? m.genre.split(',').map((s: string) => s.trim()) : [],
      status: m.status === 1 ? 'ONGOING' : m.status === 2 ? 'COMPLETED' : 'UNKNOWN',
      thumbnailUrl: m.thumbnailUrl ?? '',
      initialized: m.initialized ?? false,
      inLibrary: m.inLibrary ?? false,
      sourceId: m.sourceId
    }));
    return {
      mangas: mangasMapped,
      hasNextPage: data.hasNextPage ?? false
    };
  },

  searchSource: async (sourceId: string, query: string, page: number): Promise<{ mangas: Manga[]; hasNextPage: boolean }> => {
    const data = await trpcQuery('source.search', { sourceId, query, page });
    const mangasMapped = (data.mangas || []).map((m: any) => ({
      id: m.id ?? 0,
      url: m.url,
      title: m.title,
      artist: m.artist,
      author: m.author,
      description: m.description,
      genre: m.genre ? m.genre.split(',').map((s: string) => s.trim()) : [],
      status: m.status === 1 ? 'ONGOING' : m.status === 2 ? 'COMPLETED' : 'UNKNOWN',
      thumbnailUrl: m.thumbnailUrl ?? '',
      initialized: m.initialized ?? false,
      inLibrary: m.inLibrary ?? false,
      sourceId: m.sourceId
    }));
    return {
      mangas: mangasMapped,
      hasNextPage: data.hasNextPage ?? false
    };
  },

  // Manga Details
  getMangaDetails: async (mangaId: number): Promise<Manga> => {
    const m = await trpcQuery('manga.byId', { id: mangaId });
    return {
      id: m.id,
      url: m.url,
      title: m.title,
      artist: m.artist,
      author: m.author,
      description: m.description,
      genre: m.genre ? m.genre.split(',').map((s: string) => s.trim()) : [],
      status: m.status === 1 ? 'ONGOING' : m.status === 2 ? 'COMPLETED' : 'UNKNOWN',
      thumbnailUrl: m.thumbnailUrl ?? '',
      initialized: m.initialized,
      inLibrary: m.inLibrary,
      sourceId: m.sourceId
    };
  },
  
  getMangaDetailsFull: async (mangaId: number): Promise<Manga> => {
    // 1. Trigger details fetch from source
    await trpcMutation('manga.fetchDetails', { mangaId });
    // 2. Load latest details
    return api.getMangaDetails(mangaId);
  },
  
  getMangaChapters: async (mangaId: number): Promise<Chapter[]> => {
    // 1. Fetch from source to get latest chapters
    await trpcMutation('chapter.fetchFromSource', { mangaId });
    // 2. Query chapters database
    const list: any[] = await trpcQuery('chapter.byMangaId', { mangaId });
    return list.map(ch => ({
      id: ch.id,
      url: ch.url,
      name: ch.name,
      chapterNumber: ch.chapterNumber,
      read: ch.isRead,
      bookmark: ch.isBookmarked,
      lastPageRead: ch.lastPageRead,
      dateUpload: ch.dateUpload ? new Date(ch.dateUpload).getTime() : 0,
      sourceOrder: ch.sourceOrder,
      downloaded: ch.isDownloaded
    }));
  },

  // Library actions
  addToLibrary: async (mangaId: number): Promise<void> => {
    await trpcMutation('manga.addToLibrary', { mangaId });
  },
  
  removeFromLibrary: async (mangaId: number): Promise<void> => {
    await trpcMutation('manga.removeFromLibrary', { mangaId });
  },

  // Categories & Library Management
  getCategories: async (): Promise<Category[]> => {
    const list: any[] = await trpcQuery('category.all');
    return list.map(c => ({
      id: c.id,
      name: c.name,
      order: c.order
    }));
  },
  
  getCategoryMangas: async (categoryId: number): Promise<Manga[]> => {
    const list: any[] = await trpcQuery('manga.library', { categoryId });
    return list.map(m => ({
      id: m.id,
      url: m.url,
      title: m.title,
      artist: m.artist,
      author: m.author,
      description: m.description,
      genre: m.genre ? m.genre.split(',').map((s: string) => s.trim()) : [],
      status: m.status === 1 ? 'ONGOING' : m.status === 2 ? 'COMPLETED' : 'UNKNOWN',
      thumbnailUrl: m.thumbnailUrl ?? '',
      initialized: m.initialized,
      inLibrary: m.inLibrary,
      sourceId: m.sourceId
    }));
  },
  
  getLibrary: async (): Promise<Manga[]> => {
    const list: any[] = await trpcQuery('manga.library');
    return list.map(m => ({
      id: m.id,
      url: m.url,
      title: m.title,
      artist: m.artist,
      author: m.author,
      description: m.description,
      genre: m.genre ? m.genre.split(',').map((s: string) => s.trim()) : [],
      status: m.status === 1 ? 'ONGOING' : m.status === 2 ? 'COMPLETED' : 'UNKNOWN',
      thumbnailUrl: m.thumbnailUrl ?? '',
      initialized: m.initialized,
      inLibrary: m.inLibrary,
      sourceId: m.sourceId
    }));
  },

  // Chapter details & reading pages
  getChapterDetails: async (chapterId: number): Promise<any> => {
    const ch = await trpcQuery('chapter.byId', { id: chapterId });
    return {
      id: ch.id,
      name: ch.name,
      chapterNumber: ch.chapterNumber,
      lastPageRead: ch.lastPageRead,
      pageCount: ch.pageCount
    };
  },

  getPages: async (chapterId: number): Promise<string[]> => {
    // Resolves pages list `{ index: number, url: string }[]` from source
    const pagesList: any[] = await trpcQuery('chapter.pages', { chapterId });
    // Return array of proxy URLs or raw URLs
    return pagesList.sort((a, b) => a.index - b.index).map(p => p.url);
  },
  
  markChapterRead: async (chapterId: number, read: boolean): Promise<void> => {
    await trpcMutation('chapter.markRead', { chapterId, read });
  },

  updateProgress: async (chapterId: number, page: number): Promise<void> => {
    await trpcMutation('chapter.updateProgress', { chapterId, page });
  },

  getSettings: async (): Promise<Record<string, string>> => {
    return trpcQuery('settings.all');
  },

  updateSetting: async (key: string, value: string): Promise<void> => {
    await trpcMutation('settings.set', { key, value });
  },

  updateSettings: async (settings: Record<string, string>): Promise<void> => {
    await trpcMutation('settings.setMany', settings);
  }
};
