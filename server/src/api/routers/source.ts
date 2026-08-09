import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { ExtensionManager } from '../../extensions/ExtensionManager';
import { TRPCError } from '@trpc/server';

export const sourceRouter = router({
  all: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.source.findMany({ orderBy: { name: 'asc' } });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const source = await ctx.prisma.source.findUnique({ where: { id: input.id } });
      if (!source) throw new TRPCError({ code: 'NOT_FOUND', message: 'Source not found' });
      return source;
    }),

  popular: publicProcedure
    .input(
      z.object({
        sourceId: z.string(),
        page: z.number().min(1).default(1),
      })
    )
    .query(async ({ input }) => {
      const ext = ExtensionManager.getInstance();
      const source = ext.getSource(input.sourceId);
      if (!source) throw new TRPCError({ code: 'NOT_FOUND', message: 'Source not loaded' });
      return source.getPopularManga(input.page);
    }),

  search: publicProcedure
    .input(
      z.object({
        sourceId: z.string(),
        query: z.string(),
        page: z.number().min(1).default(1),
        filters: z.array(z.any()).optional().default([]),
      })
    )
    .query(async ({ input }) => {
      const ext = ExtensionManager.getInstance();
      const source = ext.getSource(input.sourceId);
      if (!source) throw new TRPCError({ code: 'NOT_FOUND', message: 'Source not loaded' });
      return source.searchManga(input.query, input.page, input.filters);
    }),

  filters: publicProcedure
    .input(z.object({ sourceId: z.string() }))
    .query(async ({ input }) => {
      const ext = ExtensionManager.getInstance();
      const source = ext.getSource(input.sourceId);
      if (!source) return [];
      return source.getFilterList ? source.getFilterList() : [];
    }),

  latest: publicProcedure
    .input(
      z.object({
        sourceId: z.string(),
        page: z.number().min(1).default(1),
      })
    )
    .query(async ({ input }) => {
      const ext = ExtensionManager.getInstance();
      const source = ext.getSource(input.sourceId);
      if (!source) throw new TRPCError({ code: 'NOT_FOUND', message: 'Source not loaded' });
      if (!source.getLatestUpdates) throw new TRPCError({ code: 'METHOD_NOT_SUPPORTED', message: 'Source does not support latest updates' });
      return source.getLatestUpdates(input.page);
    }),
});
