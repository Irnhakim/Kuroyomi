const BASE_URL = 'http://localhost:4567/api/v1';

export interface Extension {
  name: string;
  pkgName: string;
  versionName: string;
  versionCode: number;
  lang: string;
  isNsfw: boolean;
  hasSubdirectory: boolean;
  status: 'INSTALLED' | 'AVAILABLE' | 'UNTRUSTED';
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
  downloadStatus: string;
}

export interface Category {
  id: number;
  name: string;
  order: number;
}

export const api = {
  // Base URLs for static assets or images
  getMangaThumbnailUrl: (mangaId: number) => `${BASE_URL}/manga/${mangaId}/thumbnail`,
  getExtensionIconUrl: (pkgName: string) => `${BASE_URL}/extension/icon/${pkgName}`,
  getPageImageUrl: (mangaId: number, chapterIndex: number, pageIndex: number) => 
    `${BASE_URL}/manga/${mangaId}/chapter/${chapterIndex}/page/${pageIndex}`,

  // Extension API
  getExtensions: async (): Promise<Extension[]> => {
    const res = await fetch(`${BASE_URL}/extension/list`);
    return res.json();
  },
  installExtension: async (pkgName: string): Promise<void> => {
    await fetch(`${BASE_URL}/extension/install/${pkgName}`);
  },
  uninstallExtension: async (pkgName: string): Promise<void> => {
    await fetch(`${BASE_URL}/extension/uninstall/${pkgName}`);
  },

  // Sources API
  getSources: async (): Promise<Source[]> => {
    const res = await fetch(`${BASE_URL}/source/list`);
    return res.json();
  },
  getSourcePopular: async (sourceId: string, pageNum: number): Promise<{ mangas: Manga[]; hasNextPage: boolean }> => {
    const res = await fetch(`${BASE_URL}/source/${sourceId}/popular/${pageNum}`);
    const data = await res.json();
    // Suwayomi API returns { "mangas": [...], "hasNextPage": boolean }
    return {
      mangas: data.mangas || data || [],
      hasNextPage: data.hasNextPage ?? false,
    };
  },
  getSourceLatest: async (sourceId: string, pageNum: number): Promise<{ mangas: Manga[]; hasNextPage: boolean }> => {
    const res = await fetch(`${BASE_URL}/source/${sourceId}/latest/${pageNum}`);
    const data = await res.json();
    return {
      mangas: data.mangas || data || [],
      hasNextPage: data.hasNextPage ?? false,
    };
  },
  searchSource: async (sourceId: string, query: string, pageNum: number): Promise<{ mangas: Manga[]; hasNextPage: boolean }> => {
    // Suwayomi search endpoints can be GET or POST.
    // GET /api/v1/source/{sourceId}/search?query={query}&pageNum={pageNum}
    const res = await fetch(`${BASE_URL}/source/${sourceId}/search?query=${encodeURIComponent(query)}&pageNum=${pageNum}`);
    const data = await res.json();
    return {
      mangas: data.mangas || data || [],
      hasNextPage: data.hasNextPage ?? false,
    };
  },

  // Manga Details
  getMangaDetails: async (mangaId: number): Promise<Manga> => {
    const res = await fetch(`${BASE_URL}/manga/${mangaId}`);
    return res.json();
  },
  getMangaDetailsFull: async (mangaId: number): Promise<Manga> => {
    const res = await fetch(`${BASE_URL}/manga/${mangaId}/full`);
    return res.json();
  },
  getMangaChapters: async (mangaId: number): Promise<Chapter[]> => {
    const res = await fetch(`${BASE_URL}/manga/${mangaId}/chapters`);
    return res.json();
  },

  // Library actions
  addToLibrary: async (mangaId: number): Promise<void> => {
    await fetch(`${BASE_URL}/manga/${mangaId}/library`);
  },
  removeFromLibrary: async (mangaId: number): Promise<void> => {
    await fetch(`${BASE_URL}/manga/${mangaId}/library`, { method: 'DELETE' });
  },

  // Categories & Library Management
  getCategories: async (): Promise<Category[]> => {
    const res = await fetch(`${BASE_URL}/category`);
    return res.json();
  },
  getCategoryMangas: async (categoryId: number): Promise<Manga[]> => {
    const res = await fetch(`${BASE_URL}/category/${categoryId}`);
    return res.json();
  },
  
  // Custom API wrapper for all library mangas
  // Since Suwayomi retrieves library mangas via category index, category id -1 is default/all
  getLibrary: async (): Promise<Manga[]> => {
    // We can fetch category -1 (which stands for default/all in Suwayomi) or list categories and merge
    try {
      const res = await fetch(`${BASE_URL}/category/-1`);
      if (res.ok) {
        return res.json();
      }
    } catch (e) {
      console.error("Failed to load category -1, trying default endpoints", e);
    }
    // Fallback to fetch categories and read each
    const categories = await api.getCategories();
    let allManga: Manga[] = [];
    const seenIds = new Set<number>();
    
    for (const cat of categories) {
      try {
        const mangas = await api.getCategoryMangas(cat.id);
        for (const m of mangas) {
          if (!seenIds.has(m.id)) {
            seenIds.add(m.id);
            allManga.push(m);
          }
        }
      } catch (err) {
        console.error(`Failed to load category ${cat.name}`, err);
      }
    }
    return allManga;
  },

  // Chapter details / Pages
  getChapterDetails: async (mangaId: number, chapterIndex: number): Promise<any> => {
    const res = await fetch(`${BASE_URL}/manga/${mangaId}/chapter/${chapterIndex}`);
    return res.json();
  },
  markChapterRead: async (mangaId: number, chapterIndex: number, read: boolean): Promise<void> => {
    await fetch(`${BASE_URL}/manga/${mangaId}/chapter/${chapterIndex}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read })
    });
  }
};
