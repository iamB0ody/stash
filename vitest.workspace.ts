import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/core',
  'packages/engine',
  'packages/platform-mac',
  'packages/platform-windows',
  'packages/platform-linux',
]);
