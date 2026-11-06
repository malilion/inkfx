import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { effectPaths } from '../src/fx/index.js';
export const root = fileURLToPath(new URL('../', import.meta.url));
export const examples = Object.values(effectPaths).map(file => resolve(root, file));
export const isMain = url => process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === url;
export function parseArgs(args, allowed) {
  const files = [], options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith('--')) { files.push(effectPaths[arg] ? resolve(root, effectPaths[arg]) : resolve(arg)); continue; }
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
