import { PrismaClient } from '@prisma/client';
import { ExtensionManager } from '../extensions/ExtensionManager';
import path from 'path';
import fs from 'fs';

const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || './data/downloads';

export class ChapterService {
  static async getByMangaId(
    prisma: PrismaClient,
    input: { mangaId: number; sort?: string; order?: 'asc' | 'desc' }
  ) {
    const orderBy: any = {};
    switch (input.sort) {
      case 'chapterNumber': orderBy.chapterNumber = input.order || 'asc'; break;
      case 'dateUpload': orderBy.dateUpload = input.order || 'desc'; break;
      case 'fetchedAt': orderBy.fetchedAt = input.order || 'desc'; break;
      default: orderBy.sourceOrder = input.order || 'asc'; break;
    }

    return prisma.chapter.findMany({
      where: { mangaId: input.mangaId },
      orderBy,
    });
  }

  static async getById(prisma: PrismaClient, id: number) {
    return prisma.chapter.findUnique({ where: { id } });
  }

  static async getPages(prisma: PrismaClient, chapterId: number) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { manga: true },
    });
    if (!chapter) throw new Error('Chapter not found');

    // Check if downloaded
    if (chapter.isDownloaded) {
      const chapterDir = path.join(DOWNLOADS_DIR, String(chapter.mangaId), String(chapterId));
      if (fs.existsSync(chapterDir)) {
        const files = fs.readdirSync(chapterDir)
          .filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
          .sort();
        return files.map((file, index) => ({
          index,
          imageUrl: `/data/downloads/${chapter.mangaId}/${chapterId}/${file}`,
        }));
      }
    }

    // Fetch from source
    const source = ExtensionManager.getInstance().getSource(chapter.manga.sourceId);
    if (!source) throw new Error(`Source ${chapter.manga.sourceId} not loaded`);

    const pages = await source.getPageList({
      url: chapter.url,
      name: chapter.name,
      chapterNumber: chapter.chapterNumber,
    });

    // Update page count
    await prisma.chapter.update({
      where: { id: chapterId },
      data: { pageCount: pages.length },
    });

    return pages.map((page, index) => ({
      index,
      imageUrl: page.imageUrl,
    }));
  }

  static async fetchFromSource(prisma: PrismaClient, mangaId: number) {
    const manga = await prisma.manga.findUnique({ where: { id: mangaId } });
    if (!manga) throw new Error('Manga not found');

    const source = ExtensionManager.getInstance().getSource(manga.sourceId);
    if (!source) throw new Error(`Source ${manga.sourceId} not loaded`);

    const chapters = await source.getChapterList({ url: manga.url, title: manga.title });

    // Upsert chapters
    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];
      await prisma.chapter.upsert({
        where: { url_mangaId: { url: ch.url, mangaId } },
        update: {
          name: ch.name,
          chapterNumber: ch.chapterNumber ?? -1,
          scanlator: ch.scanlator,
          dateUpload: ch.dateUpload ? new Date(ch.dateUpload) : null,
          sourceOrder: i,
        },
        create: {
          url: ch.url,
          name: ch.name,
          chapterNumber: ch.chapterNumber ?? -1,
          scanlator: ch.scanlator,
          dateUpload: ch.dateUpload ? new Date(ch.dateUpload) : null,
          sourceOrder: i,
          mangaId,
        },
      });
    }

    await prisma.manga.update({
      where: { id: mangaId },
      data: { chaptersLastFetchedAt: new Date() },
    });

    return prisma.chapter.findMany({
      where: { mangaId },
      orderBy: { sourceOrder: 'asc' },
    });
  }

  static async markRead(prisma: PrismaClient, chapterId: number, read: boolean) {
    return prisma.chapter.update({
      where: { id: chapterId },
      data: { isRead: read, lastReadAt: read ? new Date() : null },
    });
  }

  static async markAllRead(prisma: PrismaClient, mangaId: number) {
    return prisma.chapter.updateMany({
      where: { mangaId },
      data: { isRead: true, lastReadAt: new Date() },
    });
  }

  static async updateProgress(prisma: PrismaClient, chapterId: number, page: number) {
    const chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: { lastPageRead: page, lastReadAt: new Date() },
    });

    // Add to history
    await prisma.readingHistory.create({
      data: { mangaId: chapter.mangaId, chapterId, page },
    });

    // Auto-mark as read if last page
    if (chapter.pageCount > 0 && page >= chapter.pageCount - 1) {
      await prisma.chapter.update({
        where: { id: chapterId },
        data: { isRead: true },
      });
    }

    return chapter;
  }

  static async toggleBookmark(prisma: PrismaClient, chapterId: number) {
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
    if (!chapter) throw new Error('Chapter not found');

    return prisma.chapter.update({
      where: { id: chapterId },
      data: { isBookmarked: !chapter.isBookmarked },
    });
  }
}
