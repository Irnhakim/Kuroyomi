import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

const DEFAULTS = {
  readerMode: 'paged-ltr',
  readerBackground: 'black',
  readerPageFit: 'width',
  readerWebtoonGap: '8',
  libraryLayout: 'grid',
  libraryColumns: '3',
  theme: 'dark',
  language: 'id',
  autoUpdateLibrary: 'true',
  updateInterval: '12',
  downloadAheadLimit: '3',
  extensionRepoUrl: 'https://raw.githubusercontent.com/keiyoushi/extensions/main/index.min.json',
};

export const settingsRouter = router({
  all: publicProcedure.query(async ({ ctx }) => {
    const configs = await ctx.prisma.serverConfig.findMany();
    const map = Object.fromEntries(configs.map((c) => [c.key, c.value]));
    return { ...DEFAULTS, ...map };
  }),

  get: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ ctx, input }) => {
      const config = await ctx.prisma.serverConfig.findUnique({ where: { key: input.key } });
      return config?.value ?? DEFAULTS[input.key as keyof typeof DEFAULTS] ?? null;
    }),

  set: publicProcedure
    .input(z.object({ key: z.string(), value: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.serverConfig.upsert({
        where: { key: input.key },
        update: { value: input.value },
        create: { key: input.key, value: input.value },
      });
    }),

  setMany: publicProcedure
    .input(z.record(z.string()))
    .mutation(async ({ ctx, input }) => {
      await Promise.all(
        Object.entries(input).map(([key, value]) =>
          ctx.prisma.serverConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value },
          })
        )
      );
      return { success: true };
    }),
});
