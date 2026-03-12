import type { AstroIntegration } from 'astro'
import type { SitemapOptions } from '@astrojs/sitemap'

import { fileURLToPath } from 'node:url'

import * as generateSitemapModule from '../../node_modules/@astrojs/sitemap/dist/generate-sitemap.js'
import * as validateOptionsModule from '../../node_modules/@astrojs/sitemap/dist/validate-options.js'
import * as writeSitemapModule from '../../node_modules/@astrojs/sitemap/dist/write-sitemap.js'

const PKG_NAME = '@marvelorder/compat-sitemap'
const { generateSitemap } = generateSitemapModule as any
const { validateOptions } = validateOptionsModule as any
const { writeSitemap } = writeSitemapModule as any

function formatConfigErrorMessage ( err: { issues?: Array<{ path: Array<string | number>, message: string }> } ) {
    return err.issues?.map( issue => ` ${ issue.path.join( '.' ) }  ${ issue.message }.` ).join( '\n' ) ?? ''
}

export default function compatSitemap ( options?: SitemapOptions ): AstroIntegration {
    let config: any

    return {
        name: PKG_NAME,
        hooks: {
            'astro:config:done': async ( { config: astroConfig } ) => {
                config = astroConfig
            },
            'astro:build:done': async ( { dir, pages, logger } ) => {
                try {
                    if ( !config.site ) {
                        logger.warn( 'The Sitemap integration requires the `site` astro.config option. Skipping.' )
                        return
                    }

                    const opts = validateOptions( config.site, options )
                    const {
                        filenameBase = 'sitemap',
                        filter,
                        customPages,
                        customSitemaps,
                        serialize,
                        entryLimit,
                    } = opts
                    const outFile = `${ filenameBase }-index.xml`
                    const finalSiteUrl = new URL( config.base, config.site )

                    let pageUrls = pages.map( ( page: { pathname: string } ) => {
                        if ( page.pathname !== '' && !finalSiteUrl.pathname.endsWith( '/' ) ) {
                            finalSiteUrl.pathname += '/'
                        }

                        const path = finalSiteUrl.pathname + page.pathname
                        return new URL( path, finalSiteUrl ).href
                    } )

                    pageUrls = Array.from( new Set( [ ...pageUrls, ...( customPages ?? [] ) ] ) )

                    if ( filter ) {
                        pageUrls = pageUrls.filter( filter )
                    }

                    if ( pageUrls.length === 0 ) {
                        logger.warn( `No pages found!\n\`${ outFile }\` not created.` )
                        return
                    }

                    let urlData = generateSitemap( pageUrls, finalSiteUrl.href, opts )

                    if ( serialize ) {
                        const serializedUrls = []

                        for ( const item of urlData ) {
                            const serialized = await Promise.resolve( serialize( item ) )

                            if ( serialized ) {
                                serializedUrls.push( serialized )
                            }
                        }

                        if ( serializedUrls.length === 0 ) {
                            logger.warn( 'No pages found!' )
                            return
                        }

                        urlData = serializedUrls
                    }

                    await writeSitemap(
                        {
                            filenameBase,
                            hostname: finalSiteUrl.href,
                            destinationDir: fileURLToPath( dir ),
                            publicBasePath: config.base,
                            sourceData: urlData,
                            limit: entryLimit,
                            customSitemaps,
                        },
                        config,
                    )

                    logger.info( `\`${ outFile }\` created.` )
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
