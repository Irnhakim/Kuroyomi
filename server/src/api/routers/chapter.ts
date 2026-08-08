import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { ChapterService } from '../../services/ChapterService';
import { TRPCError } from '@trpc/server';

export const chapterRouter = router({
  // Get chapters for a manga
  byMangaId: publicProcedure
    .input(
      z.object({
        mangaId: z.number(),
        sort: z.enum(['sourceOrder', 'chapterNumber', 'dateUpload', 'fetchedAt']).optional().default('sourceOrder'),
        order: z.enum(['asc', 'desc']).optional().default('asc'),
      })
    )
    .query(async ({ ctx, input }) => {
      return ChapterService.getByMangaId(ctx.prisma, input);
    }),

  // Get single chapter
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const chapter = await ChapterService.getById(ctx.prisma, input.id);
      if (!chapter) throw new TRPCError({ code: 'NOT_FOUND', message: 'Chapter not found' });
      return chapter;
    }),

  // Get pages for a chapter
  pages: publicProcedure
    .input(z.object({ chapterId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ChapterService.getPages(ctx.prisma, input.chapterId);
    }),

  // Fetch chapters from source
  fetchFromSource: publicProcedure
    .input(z.object({ mangaId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ChapterService.fetchFromSource(ctx.prisma, input.mangaId);
    }),

  // Mark chapter as read
  markRead: publicProcedure
    .input(
      z.object({
        chapterId: z.number(),
        read: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ChapterService.markRead(ctx.prisma, input.chapterId, input.read);
    }),

  // Mark all chapters as read
  markAllRead: publicProcedure
    .input(z.object({ mangaId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ChapterService.markAllRead(ctx.prisma, input.mangaId);
    }),

  // Update reading progress
  updateProgress: publicProcedure
    .input(
      z.object({
        chapterId: z.number(),
        page: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ChapterService.updateProgress(ctx.prisma, input.chapterId, input.page);
    }),

  // Toggle bookmark
  toggleBookmark: publicProcedure
    .input(z.object({ chapterId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ChapterService.toggleBookmark(ctx.prisma, input.chapterId);
    }),
});
