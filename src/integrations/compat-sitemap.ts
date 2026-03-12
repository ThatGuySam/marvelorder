import type { AstroIntegration } from 'astro'

import { relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { simpleSitemapAndIndex } from 'sitemap'

import { generateSitemap } from '../../node_modules/@astrojs/sitemap/dist/generate-sitemap.js'
import { Logger } from '../../node_modules/@astrojs/sitemap/dist/utils/logger.js'
import { validateOptions } from '../../node_modules/@astrojs/sitemap/dist/validate-options.js'

const PKG_NAME = '@astrojs/sitemap'
const OUTFILE = 'sitemap-index.xml'

function formatConfigErrorMessage ( err: { issues?: Array<{ path: Array<string | number>, message: string }> } ) {
    return err.issues?.map( issue => ` ${issue.path.join( '.' )}  ${issue.message}.` ).join( '\n' ) ?? ''
}

export default function compatSitemap ( options?: Parameters<typeof validateOptions>[ 1 ] ): AstroIntegration {
    let config: any
    const logger = new Logger( PKG_NAME )

    return {
        name: '@marvelorder/compat-sitemap',
        hooks: {
            'astro:config:done': async ( { config: astroConfig } ) => {
                config = astroConfig
            },
            'astro:build:done': async ( { dir, routes, pages } ) => {
                try {
                    if ( !config.site ) {
                        logger.warn( 'The Sitemap integration requires the `site` astro.config option. Skipping.' )
                        return
                    }

                    const opts = validateOptions( config.site, options )
                    const { filter, customPages, serialize, entryLimit } = opts
                    const finalSiteUrl = new URL( config.base, config.site )

                    let pageUrls = pages.map( ( page: { pathname: string } ) => {
                        if ( page.pathname !== '' && !finalSiteUrl.pathname.endsWith( '/' ) )
                            finalSiteUrl.pathname += '/'

                        const path = finalSiteUrl.pathname + page.pathname
                        return new URL( path, finalSiteUrl ).href
                    } )

                    const routeUrls = routes.reduce( ( urls: string[], route: any ) => {
                        if ( !route.pathname )
                            return urls

                        const path = finalSiteUrl.pathname + route.generate( route.pathname ).substring( 1 )
                        const newUrl = new URL( path, finalSiteUrl ).href

                        if ( config.trailingSlash === 'never' )
                            urls.push( newUrl )
                        else if ( config.build.format === 'directory' && !newUrl.endsWith( '/' ) )
                            urls.push( `${newUrl}/` )
                        else
                            urls.push( newUrl )

                        return urls
                    }, [] )

                    pageUrls = Array.from( new Set( [ ...pageUrls, ...routeUrls, ...( customPages ?? [] ) ] ) )

                    if ( filter )
                        pageUrls = pageUrls.filter( filter )

                    if ( pageUrls.length === 0 ) {
                        logger.warn( `No pages found!\n\`${OUTFILE}\` not created.` )
                        return
                    }

                    let urlData = generateSitemap( pageUrls, finalSiteUrl.href, opts )

                    if ( serialize ) {
                        const serializedUrls = []

                        for ( const item of urlData ) {
                            const serialized = await Promise.resolve( serialize( item ) )

                            if ( serialized )
                                serializedUrls.push( serialized )
                        }

                        if ( serializedUrls.length === 0 ) {
                            logger.warn( 'No pages found!' )
                            return
                        }

                        urlData = serializedUrls
                    }

                    const destinationDir = relative( fileURLToPath( config.root ), fileURLToPath( dir ) ) || '.'

                    await simpleSitemapAndIndex( {
                        hostname: finalSiteUrl.href,
                        destinationDir,
                        sourceData: urlData,
                        limit: entryLimit,
                        gzip: false,
                    } )

                    logger.success( `\`${OUTFILE}\` is created.` )
                }
                catch ( error: any ) {
                    if ( error?.name === 'ZodError' ) {
                        logger.warn( formatConfigErrorMessage( error ) )
                        return
                    }

                    throw error
                }
            },
        },
    }
}
