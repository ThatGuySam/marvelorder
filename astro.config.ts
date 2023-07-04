import { defineConfig } from 'astro/config'
import preact from '@astrojs/preact'
import react from '@astrojs/react'

import { netlifyFunctions } from '@astrojs/netlify'
import vue from '@astrojs/vue'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'

// https://astro.build/config
export default defineConfig( {
    output: 'server',
    // Netlify Adapter - https://docs.astro.build/en/guides/integrations-guide/netlify/
    // Netlify Deploy Guide - https://docs.astro.build/en/guides/deploy/netlify/#adapter-for-ssredge
    adapter: netlifyFunctions( {
        dist: new URL( './dist/', import.meta.url ),
    } ),
    site: 'https://marvelorder.com',
    integrations: [// Enable Preact to support Preact JSX components.
        preact(), // Enable React for the Algolia search component.
        react(),
        vue(),
        tailwind( {
            // Example: Disable injecting a basic `base.css` import on every page.
            // Useful if you need to define and/or import your own custom `base.css`.
            // https://github.com/withastro/astro/tree/main/packages/integrations/tailwind#configuration
            config: { applyBaseStyles: false },
        } ),
        sitemap(),
    ],
    // Vite options
    // https://docs.astro.build/en/reference/configuration-reference/#vite
    vite: {
        build: {
            commonjsOptions: {
                transformMixedEsModules: true,
            },
        },
    },
} )
