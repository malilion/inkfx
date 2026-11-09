import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { effectPaths } from '../src/fx/index.js';
export const root = fileURLToPath(new URL('../', import.meta.url));
export const examples = Object.values(effectPaths).map(file => resolve(root, file));
export const isMain = url => process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === url;
export function parseArgs(args, allowed) {
  const files = [], options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith('--')) {
      const id = Object.hasOwn(effectPaths, arg) ? arg
        : Object.keys(effectPaths).find(id => effectPaths[id] === `src/fx/${arg}.js`);
      if (id) files.push(resolve(root, effectPaths[id]));
      else if (/\.m?js$/.test(arg) || existsSync(resolve(arg))) files.push(resolve(arg));
      else throw new Error(`Unknown effect ID: "${arg}". Run node tools/render.mjs --list for valid IDs, or pass a .js/.mjs file path.`);
      continue;
    }
    const key = arg.slice(2);
    if (['help', 'list', 'all'].includes(key)) { options[key] = true; continue; }
    if (!allowed.includes(key)) throw new Error(`Unknown option: ${arg}`);
    if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Missing value: ${arg}`);
    options[key] = args[++i];
  }
  return { files, options };
}
export function numberOption(options, key, fallback) {
  if (options[key] === undefined) return fallback;
  const value = Number(options[key]);
  if (!Number.isFinite(value)) throw new Error(`--${key} must be numeric`);
  return value;
}
export function listFX() {
  for (const [id, path] of Object.entries(effectPaths)) console.log(`${id.padEnd(18)} ${path}`);
}
