import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, './.env') });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
