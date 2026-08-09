import fs from 'fs';
import path from 'path';

const dirs = [
  process.env.EXTENSIONS_DIR || './data/extensions',
  process.env.DOWNLOADS_DIR || './data/downloads',
  process.env.THUMBNAILS_DIR || './data/thumbnails',
];

export function ensureDirectories() {
  for (const dir of dirs) {
    const absPath = path.resolve(process.cwd(), dir);
    fs.mkdirSync(absPath, { recursive: true });
  }
}
