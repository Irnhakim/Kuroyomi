// Core types for the extension system (port dari Suwayomi/Tachiyomi concept)

export interface MangaInfo {
  url: string;
  title: string;
  thumbnail_url?: string;
  author?: string;
  artist?: string;
  description?: string;
  genre?: string;
  status?: number;
  initialized?: boolean;
}

export interface ChapterInfo {
  url: string;
  name: string;
  chapterNumber?: number;
  scanlator?: string;
  dateUpload?: number;
}

export interface PageInfo {
  index: number;
  imageUrl: string;
  imageData?: string;
}

export interface MangasPage {
  mangas: MangaInfo[];
  hasNextPage: boolean;
}

export interface Filter {
  type: string;
  name: string;
  value?: any;
}

export interface MangaSource {
  id: string;
  name: string;
  lang: string;
  baseUrl: string;
  supportsLatest: boolean;
  iconUrl?: string;

  getPopularManga(page: number): Promise<MangasPage>;
  searchManga(query: string, page: number, filters: Filter[]): Promise<MangasPage>;
  getMangaDetails(manga: Pick<MangaInfo, 'url' | 'title'>): Promise<MangaInfo>;
  getChapterList(manga: Pick<MangaInfo, 'url' | 'title'>): Promise<ChapterInfo[]>;
  getPageList(chapter: Pick<ChapterInfo, 'url' | 'name' | 'chapterNumber'>): Promise<PageInfo[]>;
  getLatestUpdates?(page: number): Promise<MangasPage>;
  getFilterList?(): Filter[];
}

export interface ExtensionInfo {
  pkgName: string;
  name: string;
  lang: string;
  versionName: string;
  versionCode: number;
  iconUrl?: string;
  apkName?: string;
  repoUrl?: string;
  isNsfw?: boolean;
  sources: Array<{
    id: string;
    name: string;
    lang: string;
    language?: string;
    baseUrl: string;
    homeUrl?: string;
  }>;
}
