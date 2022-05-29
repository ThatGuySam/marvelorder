import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import react from '@astrojs/react';

import vue from "@astrojs/vue";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
    site: 'https://marvelorder.com',
    integrations: [// Enable Preact to support Preact JSX components.
        preact(), // Enable React for the Algolia search component.
        react(), 
        vue(), 
        tailwind(), 
        sitemap()
    ],
    // Vite options
    // https://docs.astro.build/en/reference/configuration-reference/#vite
    vite: {
        build: {
            commonjsOptions: {
                transformMixedEsModules: true,
            }
        }
    }
})