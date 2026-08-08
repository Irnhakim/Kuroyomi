import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const categoryRouter = router({
  all: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.category.findMany({ orderBy: { order: 'asc' } });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const cat = await ctx.prisma.category.findUnique({ where: { id: input.id } });
      if (!cat) throw new TRPCError({ code: 'NOT_FOUND' });
      return cat;
    }),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const count = await ctx.prisma.category.count();
      return ctx.prisma.category.create({
        data: { name: input.name, order: count },
      });
    }),

  update: publicProcedure
    .input(z.object({ id: z.number(), name: z.string().min(1), order: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.category.update({
        where: { id: input.id },
        data: { name: input.name, ...(input.order !== undefined && { order: input.order }) },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.category.delete({ where: { id: input.id } });
    }),

  reorder: publicProcedure
    .input(z.array(z.object({ id: z.number(), order: z.number() })))
    .mutation(async ({ ctx, input }) => {
      await Promise.all(
        input.map((item) =>
          ctx.prisma.category.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        )
      );
      return { success: true };
    }),
});
