import * as swordQiSlash from './sword/sword-qi-slash.js';
import * as crossSlash from './sword/cross-slash.js';
import * as inkWipe from './transitions/ink-wipe.js';
import * as scrollOpen from './transitions/scroll-open.js';
import * as inkSplash from './ink-burst/ink-splash.js';
export const effects = [swordQiSlash, crossSlash, inkWipe, scrollOpen, inkSplash];
export const effectPaths = Object.fromEntries(effects.map(fx => [fx.meta.id,
  `src/fx/${fx.meta.category}/${fx.meta.id}.js`]));
export function getFX(id = 'sword-qi-slash') {
  const fx = effects.find(fx => fx.meta.id === id);
  if (!fx) throw new Error(`Unknown FX: ${id}`);
  return fx;
}
