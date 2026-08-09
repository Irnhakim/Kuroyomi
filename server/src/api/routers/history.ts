import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const historyRouter = router({
  all: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.readingHistory.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { readAt: 'desc' },
        include: {
          manga: { select: { id: true, title: true, thumbnailUrl: true } },
          chapter: { select: { id: true, name: true, chapterNumber: true } },
        },
        distinct: ['chapterId'],
      });

      let nextCursor: number | undefined = undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return { items, nextCursor };
    }),

  recentManga: publicProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.readingHistory.findMany({
        take: input.limit,
        orderBy: { readAt: 'desc' },
        distinct: ['mangaId'],
        include: {
          manga: { select: { id: true, title: true, thumbnailUrl: true } },
          chapter: { select: { id: true, name: true, chapterNumber: true, lastPageRead: true, pageCount: true } },
        },
      });
    }),

  clear: publicProcedure.mutation(async ({ ctx }) => {
    return ctx.prisma.readingHistory.deleteMany({});
  }),

  clearManga: publicProcedure
    .input(z.object({ mangaId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.readingHistory.deleteMany({ where: { mangaId: input.mangaId } });
    }),
});
