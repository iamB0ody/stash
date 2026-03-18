import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/bin.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  bundle: true,
  minify: false,
  sourcemap: false,
  splitting: false,
  treeshake: true,
  noExternal: [/.*/],
  banner: {
    js: '#!/usr/bin/env node',
  },
  esbuildOptions(options) {
    options.conditions = ['@stash/source'];
  },
});
