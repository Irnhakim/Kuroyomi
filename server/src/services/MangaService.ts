import { PrismaClient } from '@prisma/client';
import { ExtensionManager } from '../extensions/ExtensionManager';

export class MangaService {
  static async getLibrary(
    prisma: PrismaClient,
    input?: {
      categoryId?: number;
      search?: string;
      sort?: string;
      order?: 'asc' | 'desc';
    }
  ) {
    const where: any = { inLibrary: true };

    if (input?.search) {
      where.title = { contains: input.search, mode: 'insensitive' };
    }

    if (input?.categoryId) {
      where.categories = { some: { categoryId: input.categoryId } };
    }

    const orderBy: any = {};
    switch (input?.sort) {
      case 'lastRead':
        orderBy.history = { _max: { readAt: input.order || 'desc' } };
        break;
      case 'lastUpdated':
        orderBy.chaptersLastFetchedAt = input.order || 'desc';
        break;
      case 'dateAdded':
        orderBy.inLibraryAt = input.order || 'desc';
        break;
      default:
        orderBy.title = input?.order || 'asc';
    }

    return prisma.manga.findMany({
      where,
      orderBy,
      include: {
        categories: { include: { category: true } },
        chapters: {
          select: { id: true, isRead: true },
        },
        _count: { select: { chapters: true } },
      },
    });
  }

  static async getById(prisma: PrismaClient, id: number) {
    return prisma.manga.findUnique({
      where: { id },
      include: {
        categories: { include: { category: true } },
        _count: { select: { chapters: true } },
      },
    });
  }

  static async addToLibrary(prisma: PrismaClient, mangaId: number) {
    return prisma.manga.update({
      where: { id: mangaId },
      data: { inLibrary: true, inLibraryAt: new Date() },
    });
  }

  static async removeFromLibrary(prisma: PrismaClient, mangaId: number) {
    return prisma.manga.update({
      where: { id: mangaId },
      data: { inLibrary: false, inLibraryAt: null },
    });
  }

  static async fetchDetails(prisma: PrismaClient, mangaId: number) {
    const manga = await prisma.manga.findUnique({ where: { id: mangaId } });
    if (!manga) throw new Error('Manga not found');

    const source = ExtensionManager.getInstance().getSource(manga.sourceId);
    if (!source) throw new Error(`Source ${manga.sourceId} not loaded`);

    const details = await source.getMangaDetails({
      url: manga.url,
      title: manga.title,
    });

    return prisma.manga.update({
      where: { id: mangaId },
      data: {
        title: details.title || manga.title,
        author: details.author,
        artist: details.artist,
        description: details.description,
        genre: details.genre,
        status: details.status || 0,
        thumbnailUrl: details.thumbnail_url,
        initialized: true,
        lastFetchedAt: new Date(),
      },
    });
  }

  static async getOrCreateFromSource(
    prisma: PrismaClient,
    data: { sourceId: string; url: string; title: string; thumbnailUrl?: string }
  ) {
    const existing = await prisma.manga.findFirst({
      where: { url: data.url, sourceId: data.sourceId },
    });

    if (existing) return existing;

    return prisma.manga.create({
      data: {
        url: data.url,
        title: data.title,
        sourceId: data.sourceId,
        thumbnailUrl: data.thumbnailUrl,
        initialized: false,
      },
    });
  }

  static async updateCategories(prisma: PrismaClient, mangaId: number, categoryIds: number[]) {
    // Delete existing
    await prisma.categoryManga.deleteMany({ where: { mangaId } });
    // Add new
    if (categoryIds.length > 0) {
      await prisma.categoryManga.createMany({
        data: categoryIds.map((categoryId) => ({ mangaId, categoryId })),
      });
    }
    return { success: true };
  }
}
