import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const root = new URL('./dist/', import.meta.url);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' };
createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const safe = path === '/' ? 'index.html' : path.replace(/^\/+/, '');
    if (safe.includes('..')) throw Error('Invalid path');
    const file = new URL(safe, root);
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(safe)] || 'application/octet-stream' });
    res.end(content);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(4173, () => console.log('Local: http://localhost:4173'));
