import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || './data/downloads';
let isRunning = false;

export class DownloadService {
  static async addToQueue(
    prisma: PrismaClient,
    input: { chapterId: number; mangaId: number; priority?: number }
  ) {
    return prisma.download.upsert({
      where: { chapterId: input.chapterId },
      update: { status: 'PENDING', error: null, progress: 0 },
      create: {
        chapterId: input.chapterId,
        mangaId: input.mangaId,
        priority: input.priority || 0,
        status: 'PENDING',
      },
    });
  }

  static async addBatchToQueue(
    prisma: PrismaClient,
    items: Array<{ chapterId: number; mangaId: number }>
  ) {
    const results = await Promise.all(
      items.map((item) => DownloadService.addToQueue(prisma, item))
    );
    DownloadService.startQueue(prisma);
    return results;
  }

  static async cancelDownload(prisma: PrismaClient, downloadId: number) {
    return prisma.download.update({
      where: { id: downloadId },
      data: { status: 'CANCELLED' },
    });
  }

  static async startQueue(prisma: PrismaClient) {
    if (isRunning) return { message: 'Already running' };
    isRunning = true;
    DownloadService.processQueue(prisma);
    return { message: 'Queue started' };
  }

  static pauseQueue() {
    isRunning = false;
    return { message: 'Queue paused' };
  }

  private static async processQueue(prisma: PrismaClient) {
    const io = (global as any).io;

    while (isRunning) {
      const next = await prisma.download.findFirst({
        where: { status: 'PENDING' },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        include: {
          chapter: true,
          manga: { select: { sourceId: true } },
        },
      });

      if (!next) {
        isRunning = false;
        break;
      }

      try {
        // Mark as downloading
        await prisma.download.update({
          where: { id: next.id },
          data: { status: 'DOWNLOADING', progress: 0 },
        });

        io?.emit('download:start', { id: next.id, chapterId: next.chapterId });

        // Get pages from extension manager
        const { ExtensionManager } = await import('../extensions/ExtensionManager');
        const source = ExtensionManager.getInstance().getSource(next.manga.sourceId);
        if (!source) throw new Error('Source not available');

        const pages = await source.getPageList({
          url: next.chapter.url,
          name: next.chapter.name,
          chapterNumber: next.chapter.chapterNumber,
        });

        const chapterDir = path.join(DOWNLOADS_DIR, String(next.mangaId), String(next.chapterId));
        fs.mkdirSync(chapterDir, { recursive: true });

        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          const ext = page.imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
          const filename = `${String(i).padStart(4, '0')}.${ext}`;
          const filepath = path.join(chapterDir, filename);

          const response = await axios.get(page.imageUrl, {
            responseType: 'arraybuffer',
            headers: { Referer: source.baseUrl || '' },
          });
          fs.writeFileSync(filepath, Buffer.from(response.data));

          const progress = ((i + 1) / pages.length) * 100;
          await prisma.download.update({ where: { id: next.id }, data: { progress } });
          io?.emit('download:progress', { id: next.id, chapterId: next.chapterId, progress });
        }

        // Mark as downloaded
        await prisma.download.update({ where: { id: next.id }, data: { status: 'DOWNLOADED', progress: 100 } });
        await prisma.chapter.update({ where: { id: next.chapterId }, data: { isDownloaded: true, pageCount: pages.length } });
        io?.emit('download:complete', { id: next.id, chapterId: next.chapterId });

      } catch (err: any) {
        await prisma.download.update({
          where: { id: next.id },
          data: { status: 'ERROR', error: err.message },
        });
        io?.emit('download:error', { id: next.id, chapterId: next.chapterId, error: err.message });
      }
    }
  }
}
