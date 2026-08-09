const BASE_URL = 'http://localhost:4567/api/v1';
const GRAPHQL_URL = 'http://localhost:4567/graphql';

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

export const api = {
  // Asset URLs directly connecting to Suwayomi REST endpoints
  getMangaThumbnailUrl: (manga: Manga) => `${BASE_URL}/manga/${manga.id}/thumbnail`,
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
    const list: any[] = await res.json();
    return list.map((ch, idx) => ({
      id: idx, // Use list index as ID for mapping/loading pages
      url: ch.url,
      name: ch.name,
      chapterNumber: ch.chapterNumber,
      read: ch.read,
      bookmark: ch.bookmark,
      lastPageRead: ch.lastPageRead,
      dateUpload: ch.dateUpload || 0,
      sourceOrder: ch.sourceOrder,
      downloaded: ch.downloadStatus === 'DOWNLOADED'
    }));
  },

  // Library Actions
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
  
  getLibrary: async (): Promise<Manga[]> => {
    const res = await fetch(`${BASE_URL}/category/-1`);
    return res.json();
  },

  // Chapter Details & Pages
  getChapterDetails: async (mangaId: number, chapterIndex: number): Promise<any> => {
    const res = await fetch(`${BASE_URL}/manga/${mangaId}/chapter/${chapterIndex}`);
    return res.json();
  },

  markChapterRead: async (mangaId: number, chapterIndex: number, read: boolean): Promise<void> => {
    await fetch(`${BASE_URL}/manga/${mangaId}/chapter/${chapterIndex}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `read=${read}`
    });
  },

  updateProgress: async (mangaId: number, chapterIndex: number, lastPageRead: number): Promise<void> => {
    await fetch(`${BASE_URL}/manga/${mangaId}/chapter/${chapterIndex}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `lastPageRead=${lastPageRead}`
    });
  },

  // Settings Management (LocalStorage for frontend specs + GraphQL for backend specs)
  getSettings: async (): Promise<Record<string, string>> => {
    const localReaderMode = localStorage.getItem('readerMode') || 'paged-ltr';
    const localTheme = localStorage.getItem('theme') || 'light';
    
    let extensionRepoUrl = 'https://raw.githubusercontent.com/keiyoushi/extensions/main/index.min.json';
    try {
      const data = await graphqlRequest(`
        query {
          settings {
            extensionRepos
          }
        }
      `);
      if (data?.settings?.extensionRepos?.length > 0) {
        extensionRepoUrl = data.settings.extensionRepos[0];
      }
    } catch (e) {
      console.warn("Failed to load repo settings from GraphQL", e);
    }
    
    return {
      readerMode: localReaderMode,
      theme: localTheme,
      extensionRepoUrl
    };
  },

  updateSettings: async (settings: Record<string, string>): Promise<void> => {
    if (settings.readerMode) localStorage.setItem('readerMode', settings.readerMode);
    if (settings.theme) localStorage.setItem('theme', settings.theme);
    
    if (settings.extensionRepoUrl) {
      const query = `
        mutation($input: SetSettingsInput!) {
          setSettings(input: $input) {
            settings {
              extensionRepos
            }
          }
        }
      `;
      const variables = {
        input: {
          settings: {
            extensionRepos: [settings.extensionRepoUrl]
          }
        }
      };
      await graphqlRequest(query, variables);
    }
  }
};
