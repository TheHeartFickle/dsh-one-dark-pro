import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.js'],
    // The host half and the route tests run in plain Node (no DOM needed).
    // Client-side behavior is exercised by the host-route-driven paths only.
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
