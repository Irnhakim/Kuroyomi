import fs from 'fs';
import path from 'path';

const swPath = path.resolve('dist/sw.js');

if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf8');
  
  // Generate a unique version based on current timestamp
  const version = `kuroyomi-cache-${Date.now()}`;
  
  // Replace the cache name version
  swContent = swContent.replace(
    /const CACHE_NAME = 'kuroyomi-cache-v\d+';/,
    `const CACHE_NAME = '${version}';`
  );
  
  fs.writeFileSync(swPath, swContent, 'utf8');
  console.log(`[SW Update] Updated CACHE_NAME in dist/sw.js to: ${version}`);
} else {
  console.warn('[SW Update] dist/sw.js not found');
}
