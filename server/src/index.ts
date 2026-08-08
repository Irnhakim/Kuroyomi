import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './api/router';
import { createContext } from './api/context';
import { imageProxyRouter } from './lib/imageProxy';
import { ExtensionManager } from './extensions/ExtensionManager';
import { ensureDirectories } from './lib/filesystem';
import path from 'path';

const PORT = parseInt(process.env.PORT || '3001');
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

async function main() {
  await ensureDirectories();

  const app = express();
  const httpServer = createServer(app);

  // Socket.io for real-time download progress
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: CLIENT_URL,
      methods: ['GET', 'POST'],
    },
  });

  // Make io available globally
  (global as any).io = io;

  io.on('connection', (socket) => {
    console.log('[Socket] Client connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected:', socket.id);
    });
  });

  // Middleware
  app.use(cors({ origin: CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: '50mb' }));

  // Serve static downloads
  app.use('/data/downloads', express.static(path.join(process.cwd(), 'data/downloads')));
  app.use('/data/thumbnails', express.static(path.join(process.cwd(), 'data/thumbnails')));

  // Image proxy
  app.use('/api/proxy', imageProxyRouter);

  // tRPC
  app.use(
    '/api/trpc',
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0', name: 'Kuroyomi Server' });
  });

  // Init extension manager
  await ExtensionManager.getInstance().init();

  httpServer.listen(PORT, () => {
    console.log(`\n🖤 Kuroyomi Server running at http://localhost:${PORT}`);
    console.log(`   tRPC API: http://localhost:${PORT}/api/trpc`);
    console.log(`   Health:   http://localhost:${PORT}/api/health\n`);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
