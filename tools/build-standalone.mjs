import { resolve } from 'node:path';
import { build } from 'esbuild';
import { effectPaths } from '../src/fx/index.js';
import { isMain, root } from './cli.mjs';

export async function buildStandalone(outdir) {
  const { metafile } = await build({
    absWorkingDir: root,
    entryPoints: effectPaths,
    outdir: resolve(outdir),
    outExtension: { '.js': '.mjs' },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    treeShaking: true,
    metafile: true,
    banner: { js: '// inkfx standalone effect. Import create, meta and act from this .mjs file.' },
  });
  for (const [path, output] of Object.entries(metafile.outputs)) {
    if (output.imports.length) throw new Error(`Standalone effect has unresolved imports: ${path}`);
  }
}

if (isMain(import.meta.url)) {
  buildStandalone(process.argv[2] ?? 'artifacts/standalone').catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
