import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.md': 'text/plain; charset=utf-8', '.png': 'image/png', '.json': 'application/json', '.mp4': 'video/mp4',
  '.svg': 'image/svg+xml', '.ico': 'image/vnd.microsoft.icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
const port = Number(process.env.PORT ?? 8080);
const server = createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
    let path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (path === '/') path = '/gallery/';
    if (path.endsWith('/')) path += 'index.html';
    const asset = path.match(/^\/gallery\/standalone\/([a-z0-9-]+\.mjs)$/);
    const file = asset ? resolve(root, 'artifacts/standalone', asset[1]) : resolve(root, `.${path}`);
    if (!file.startsWith(root.endsWith(sep) ? root : root + sep) ||
        !/^\/(gallery|src|examples|docs)\//.test(path) || !types[extname(file)] || (!asset && extname(file) === '.mjs')) {
      response.writeHead(404).end('Not found'); return;
    }
    const data = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[extname(file)], 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch { response.writeHead(404).end('Not found'); }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`inkfx gallery: http://127.0.0.1:${port}/gallery/`));
