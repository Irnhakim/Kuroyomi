import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { ExtensionManager } from '../../extensions/ExtensionManager';

export const extensionRouter = router({
  all: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.extension.findMany({ orderBy: { name: 'asc' } });
  }),

  installed: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.extension.findMany({
      where: { isInstalled: true },
      orderBy: { name: 'asc' },
    });
  }),

  available: publicProcedure.query(async () => {
    return ExtensionManager.getInstance().getAvailableExtensions();
  }),

  install: publicProcedure
    .input(z.object({ pkgName: z.string() }))
    .mutation(async ({ input }) => {
      return ExtensionManager.getInstance().installExtension(input.pkgName);
    }),

  uninstall: publicProcedure
    .input(z.object({ pkgName: z.string() }))
    .mutation(async ({ input }) => {
      return ExtensionManager.getInstance().uninstallExtension(input.pkgName);
    }),

  update: publicProcedure
    .input(z.object({ pkgName: z.string() }))
    .mutation(async ({ input }) => {
      return ExtensionManager.getInstance().updateExtension(input.pkgName);
    }),

  checkUpdates: publicProcedure.mutation(async () => {
    return ExtensionManager.getInstance().checkForUpdates();
  }),

  reload: publicProcedure.mutation(async () => {
    await ExtensionManager.getInstance().reloadAll();
    return { success: true };
  }),
});
