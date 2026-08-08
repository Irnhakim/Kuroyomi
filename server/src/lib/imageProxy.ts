import { Router } from 'express';
import axios from 'axios';

export const imageProxyRouter = Router();

imageProxyRouter.get('/', async (req, res) => {
  const { url, referer } = req.query as { url?: string; referer?: string };

  if (!url) {
    return res.status(400).json({ error: 'url parameter is required' });
  }

  try {
    const decodedUrl = decodeURIComponent(url);
    const response = await axios.get(decodedUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...(referer && { Referer: decodeURIComponent(referer) }),
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    const contentType = response.headers['content-type'] || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(response.data));
  } catch (err: any) {
    console.error('[ImageProxy] Error:', err.message);
    res.status(502).json({ error: 'Failed to proxy image', url });
  }
});
