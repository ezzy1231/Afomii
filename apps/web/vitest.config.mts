import { defineConfig } from 'vitest/config'
import path from 'node:path'

// `.mts` + import.meta.dirname rather than `__dirname`: Vite 8 loads this file
// with its native config loader, which has no CommonJS __dirname.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
