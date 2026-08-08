import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { MangaService } from '../../services/MangaService';
import { TRPCError } from '@trpc/server';

export const mangaRouter = router({
  // Get all manga in library
  library: publicProcedure
    .input(
      z.object({
        categoryId: z.number().optional(),
        search: z.string().optional(),
        sort: z.enum(['title', 'lastRead', 'lastUpdated', 'dateAdded', 'unread']).optional().default('title'),
        order: z.enum(['asc', 'desc']).optional().default('asc'),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return MangaService.getLibrary(ctx.prisma, input);
    }),

  // Get single manga by id
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const manga = await MangaService.getById(ctx.prisma, input.id);
      if (!manga) throw new TRPCError({ code: 'NOT_FOUND', message: 'Manga not found' });
      return manga;
    }),

  // Add manga to library
  addToLibrary: publicProcedure
    .input(z.object({ mangaId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return MangaService.addToLibrary(ctx.prisma, input.mangaId);
    }),

  // Remove manga from library
  removeFromLibrary: publicProcedure
    .input(z.object({ mangaId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return MangaService.removeFromLibrary(ctx.prisma, input.mangaId);
    }),

  // Fetch manga details from source
  fetchDetails: publicProcedure
    .input(z.object({ mangaId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return MangaService.fetchDetails(ctx.prisma, input.mangaId);
    }),

  // Get manga from source (creates if not exists)
  fromSource: publicProcedure
    .input(
      z.object({
        sourceId: z.string(),
        url: z.string(),
        title: z.string(),
        thumbnailUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return MangaService.getOrCreateFromSource(ctx.prisma, input);
    }),

  // Update categories for a manga
  updateCategories: publicProcedure
    .input(
      z.object({
        mangaId: z.number(),
        categoryIds: z.array(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return MangaService.updateCategories(ctx.prisma, input.mangaId, input.categoryIds);
    }),
});
