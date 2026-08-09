import { router, publicProcedure } from '../trpc';

export const statsRouter = router({
  overview: publicProcedure.query(async ({ ctx }) => {
    const [
      totalManga,
      inLibrary,
      totalChapters,
      readChapters,
      downloadedChapters,
      totalHistory,
    ] = await Promise.all([
      ctx.prisma.manga.count(),
      ctx.prisma.manga.count({ where: { inLibrary: true } }),
      ctx.prisma.chapter.count(),
      ctx.prisma.chapter.count({ where: { isRead: true } }),
      ctx.prisma.chapter.count({ where: { isDownloaded: true } }),
      ctx.prisma.readingHistory.count(),
    ]);

    return {
      totalManga,
      inLibrary,
      totalChapters,
      readChapters,
      downloadedChapters,
      totalHistory,
      readingProgress: totalChapters > 0 ? Math.round((readChapters / totalChapters) * 100) : 0,
    };
  }),

  recentActivity: publicProcedure.query(async ({ ctx }) => {
    // Last 30 days activity grouped by day
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const history = await ctx.prisma.readingHistory.findMany({
      where: { readAt: { gte: thirtyDaysAgo } },
      orderBy: { readAt: 'asc' },
      select: { readAt: true },
    });

    // Group by date
    const grouped: Record<string, number> = {};
    for (const item of history) {
      const date = item.readAt.toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + 1;
    }

    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  }),

  topGenres: publicProcedure.query(async ({ ctx }) => {
    const mangas = await ctx.prisma.manga.findMany({
      where: { inLibrary: true, genre: { not: null } },
      select: { genre: true },
    });

    const genreCount: Record<string, number> = {};
    for (const manga of mangas) {
      if (!manga.genre) continue;
      const genres = manga.genre.split(',').map((g) => g.trim());
      for (const genre of genres) {
        if (genre) genreCount[genre] = (genreCount[genre] || 0) + 1;
      }
    }

    return Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count }));
  }),

  mostRead: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.prisma.readingHistory.groupBy({
      by: ['mangaId'],
      _count: { mangaId: true },
      orderBy: { _count: { mangaId: 'desc' } },
      take: 10,
    });

    const mangaIds = result.map((r) => r.mangaId);
    const mangas = await ctx.prisma.manga.findMany({
      where: { id: { in: mangaIds } },
      select: { id: true, title: true, thumbnailUrl: true },
    });

    return result.map((r) => ({
      count: r._count.mangaId,
      manga: mangas.find((m) => m.id === r.mangaId)!,
    }));
  }),
});
