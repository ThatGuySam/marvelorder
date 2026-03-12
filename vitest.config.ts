import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig( {
    resolve: {
        alias: {
            '~': fileURLToPath( new URL( './', import.meta.url ) ),
        },
    },
    test: {
        // Fixes jsdom/canvas error
        // https://github.com/vitest-dev/vitest/issues/740#issuecomment-1042648373
        threads: false,
        // ...
        testTimeout: 30_000,
    },
} )
