import { defineConfig } from 'astro/config'
import preact from '@astrojs/preact'
import react from '@astrojs/react'

import netlify from '@astrojs/netlify'
import vue from '@astrojs/vue'
import sitemap from './src/integrations/compat-sitemap'

// https://astro.build/config
export default defineConfig( {
    // Netlify Adapter - https://docs.astro.build/en/guides/integrations-guide/netlify/
    // Netlify Deploy Guide - https://docs.astro.build/en/guides/deploy/netlify/#adapter-for-ssredge
    adapter: netlify(),
    site: 'https://marvelorder.com',
    integrations: [// Enable Preact to support Preact JSX components.
        preact( {
            include: [
                /src\/components\/Header\/SidebarToggle\.tsx$/,
                /src\/components\/Header\/LanguageSelect\.tsx$/,
                /src\/components\/RightSidebar\/ThemeToggleButton\.tsx$/,
            ],
        } ), // Enable React for the Algolia search component.
        react( {
            include: [ /src\/components\/Header\/Search\.tsx$/ ],
        } ),
        vue(),
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
