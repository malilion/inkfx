import * as songyan from './songyan.js';
import * as zhusha from './zhusha.js';
import * as shiqing from './shiqing.js';
import * as nijin from './nijin.js';
export const palettes = { songyan, zhusha, shiqing, nijin };
export function getPalette(id = 'songyan') {
  if (!Object.hasOwn(palettes, id)) throw new Error(`Unknown palette: ${id}`);
  return palettes[id];
}
