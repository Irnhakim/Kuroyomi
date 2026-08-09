import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { DownloadService } from '../../services/DownloadService';

export const downloadRouter = router({
  queue: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.download.findMany({
      where: { status: { in: ['PENDING', 'DOWNLOADING', 'ERROR'] } },
      include: {
        chapter: { select: { name: true, chapterNumber: true } },
        manga: { select: { title: true, thumbnailUrl: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }),

  all: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.download.findMany({
      include: {
        chapter: { select: { name: true, chapterNumber: true } },
        manga: { select: { title: true, thumbnailUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  add: publicProcedure
    .input(
      z.object({
        chapterId: z.number(),
        mangaId: z.number(),
        priority: z.number().optional().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return DownloadService.addToQueue(ctx.prisma, input);
    }),

  addBatch: publicProcedure
    .input(
      z.array(
        z.object({
          chapterId: z.number(),
          mangaId: z.number(),
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      return DownloadService.addBatchToQueue(ctx.prisma, input);
    }),

  cancel: publicProcedure
    .input(z.object({ downloadId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return DownloadService.cancelDownload(ctx.prisma, input.downloadId);
    }),

  retry: publicProcedure
    .input(z.object({ downloadId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.download.update({
        where: { id: input.downloadId },
        data: { status: 'PENDING', error: null, progress: 0 },
      });
    }),

  clearCompleted: publicProcedure.mutation(async ({ ctx }) => {
    return ctx.prisma.download.deleteMany({ where: { status: 'DOWNLOADED' } });
  }),

  startAll: publicProcedure.mutation(async ({ ctx }) => {
    return DownloadService.startQueue(ctx.prisma);
  }),

  pauseAll: publicProcedure.mutation(async () => {
    return DownloadService.pauseQueue();
  }),
});
