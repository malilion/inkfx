import { mkdtemp, writeFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { effectPaths } from '../src/fx/index.js';
import { root, isMain } from './cli.mjs';

/** Translate inkfx's display clock into fx-skill-kit's impact-relative clock. */
export function adapterSource(file) {
  return `import * as source from ${JSON.stringify(pathToFileURL(resolve(file)).href)};
export const meta = { ...source.meta, duration: source.meta.duration - source.act.windup };
export const act = { ...source.act, recovery: 0 };
export function create(options) {
  let instance = source.create(options);
  return { t: 0, step(dt) { this.t += dt; }, draw(frame) {
    const wanted = Math.max(0, Math.min(source.meta.duration, this.t + source.act.windup));
    if (wanted < instance.t) instance = source.create(options);
    instance.step(Math.max(0, wanted - instance.t)); instance.draw(frame);
  }};
}
`;
}
export async function main(args = process.argv.slice(2)) {
  const [tool, id, ...rest] = args;
  if (!['check', 'render', 'act'].includes(tool) || !effectPaths[id]) throw new Error('Usage: node tools/skill-kit.mjs check|render|act FX-ID [--kit ../fx-skill-kit] [kit options]');
  const at = rest.indexOf('--kit'), kit = resolve(at < 0 ? '../fx-skill-kit' : rest[at + 1] ?? '');
  if (at >= 0) rest.splice(at, 2);
  const entry = join(kit, 'tools', `${tool}.mjs`); await access(entry);
  const directory = await mkdtemp(join(tmpdir(), 'inkfx-adapter-'));
  try {
    const file = join(directory, 'fx.mjs'); await writeFile(file, adapterSource(join(root, effectPaths[id])));
    const result = spawnSync(process.execPath, [entry, file, ...rest], { stdio: 'inherit', cwd: root });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`fx-skill-kit ${tool} exited ${result.status ?? result.signal}`);
  } finally { await rm(directory, { recursive: true, force: true }); }
}
if (isMain(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
