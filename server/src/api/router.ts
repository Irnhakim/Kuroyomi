import { router } from './trpc';
import { mangaRouter } from './routers/manga';
import { chapterRouter } from './routers/chapter';
import { categoryRouter } from './routers/category';
import { sourceRouter } from './routers/source';
import { extensionRouter } from './routers/extension';
import { downloadRouter } from './routers/download';
import { historyRouter } from './routers/history';
import { settingsRouter } from './routers/settings';
import { statsRouter } from './routers/stats';

export const appRouter = router({
  manga: mangaRouter,
  chapter: chapterRouter,
  category: categoryRouter,
  source: sourceRouter,
  extension: extensionRouter,
  download: downloadRouter,
  history: historyRouter,
  settings: settingsRouter,
  stats: statsRouter,
});

export type AppRouter = typeof appRouter;
