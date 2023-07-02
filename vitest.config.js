import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'


export default defineConfig({
    plugins: [ tsconfigPaths() ], 
    test: {
        // Fixes jsdom/canvas error
        // https://github.com/vitest-dev/vitest/issues/740#issuecomment-1042648373
        threads: false
        // ...
    },
})