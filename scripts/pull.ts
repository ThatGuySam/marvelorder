// Helper library written for useful postprocessing tasks with Flat Data
// Has helper functions for manipulating csv, txt, json, excel, zip, and image files
// https://droces.github.io/Deno-Cheat-Sheet/
import { writeJSON } from 'https://deno.land/x/flat@0.0.14/mod.ts'
import { exists } from "https://deno.land/std/fs/mod.ts"

import 'https://deno.land/std/dotenv/load.ts'
import { slugify } from 'https://deno.land/x/slugify/mod.ts'
import axios from 'https://deno.land/x/axiod/mod.ts'
import matter from 'https://jspm.dev/gray-matter'
import { deepmerge, deepmergeCustom } from 'https://deno.land/x/deepmergets@v4.0.3/dist/deno/mod.ts'

import { 
    TMDB_COMPANIES, 
    TMDB_LISTS, 
    storePath,
    markdownStorePath
} from '../src/config.ts'
import { byPremiere } from '../src/helpers/sort.ts'
import { 
    upsertListingMarkdown,
    getDataFromListingContents,
    getPartsFromMarkdown, 
    makeTMDbMarkdownSection
} from '../src/helpers/markdown-page.ts'
import {
    makeListingEndpoint
} from '../src/helpers/listing.ts'

// https://github.com/RebeccaStevens/deepmerge-ts/blob/beae8b841561bd206150ef02fe10db94856c6e45/docs/deepmergeCustom.md
const deepmergeListings = deepmergeCustom( {
    mergeArrays: ( values: unknown[][] ) => Array.from( new Set( values.flat() ) ),
} as any )

interface FetchListingsOptions {
    endpoint: string
    params?: Record<string, string | number>
    listKey?: string
    tags?: string[]
}

function getNumberEnv ( key: string, fallback: number ) {
    const value = Number( Deno.env.get( key ) )

    if ( Number.isFinite( value ) && value >= 0 ) {
        return value
    }

    return fallback
}

// TMDB disabled the old hard 40 rps cap, but their docs still mention
// upper limits in that range. Keep pulls far below that threshold and
// back off politely on 429s, 5xxs, or transient network failures.
const tmdbMinIntervalMs = getNumberEnv( 'TMDB_MIN_INTERVAL_MS', 2_000 )
const tmdbBackoffBaseMs = getNumberEnv( 'TMDB_BACKOFF_BASE_MS', 2_000 )
const tmdbBackoffMaxMs = getNumberEnv( 'TMDB_BACKOFF_MAX_MS', 30_000 )
const tmdbMaxRetries = getNumberEnv( 'TMDB_MAX_RETRIES', 5 )

let lastTmdbRequestStartedAt = 0

function sleep ( ms: number ) {
    return new Promise( ( resolve ) => setTimeout( resolve, ms ) )
}

function getHeaderValue ( headers: any, headerName: string ) {
    if ( !headers ) {
        return ''
    }

    if ( typeof headers.get === 'function' ) {
        return headers.get( headerName ) || headers.get( headerName.toLowerCase() ) || ''
    }

    const headerKey = Object.keys( headers )
        .find( ( key ) => key.toLowerCase() === headerName.toLowerCase() )

    return headerKey ? String( headers[ headerKey ] ) : ''
}

function getRetryAfterMs ( headers: any ) {
    const retryAfter = getHeaderValue( headers, 'retry-after' ).trim()

    if ( retryAfter.length === 0 ) {
        return 0
    }

    const retryAfterSeconds = Number( retryAfter )

    if ( Number.isFinite( retryAfterSeconds ) ) {
        return Math.max( 0, Math.round( retryAfterSeconds * 1_000 ) )
    }

    const retryAfterDate = Date.parse( retryAfter )

    if ( Number.isNaN( retryAfterDate ) ) {
        return 0
    }

    return Math.max( 0, retryAfterDate - Date.now() )
}

async function waitForTmdbRequestWindow () {
    const now = Date.now()
    const elapsedSinceLastStart = now - lastTmdbRequestStartedAt

    if ( elapsedSinceLastStart < tmdbMinIntervalMs ) {
        await sleep( tmdbMinIntervalMs - elapsedSinceLastStart )
    }

    lastTmdbRequestStartedAt = Date.now()
}

function shouldRetryTmdbRequest ( status = 0 ) {
    return status === 0 || status === 429 || status >= 500
}

async function tmdbGet ( requestUrl: string, requestOptions: any ) {
    for ( let attempt = 0; attempt <= tmdbMaxRetries; attempt++ ) {
        await waitForTmdbRequestWindow()

        try {
            return await axios.get( requestUrl, requestOptions )
        }
        catch ( error ) {
            const responseError = error as {
                response?: {
                    status?: number
                    headers?: unknown
                }
            }

            const status = Number( responseError?.response?.status || 0 )

            if ( attempt === tmdbMaxRetries || !shouldRetryTmdbRequest( status ) ) {
                throw error
            }

            const retryAfterMs = getRetryAfterMs( responseError?.response?.headers )
            const exponentialBackoffMs = Math.min( tmdbBackoffBaseMs * 2 ** attempt, tmdbBackoffMaxMs )
            const jitterMs = Math.floor( Math.random() * 250 )
            const backoffMs = Math.max( retryAfterMs, exponentialBackoffMs + jitterMs )

            console.warn(
                `TMDB request failed with status ${ status || 'unknown' } for ${ requestUrl }. ` +
                `Retrying in ${ backoffMs }ms (attempt ${ attempt + 1 }/${ tmdbMaxRetries }).`,
            )

            await sleep( backoffMs )
        }
    }

    throw new Error( `Unable to fetch listings from ${ requestUrl }` )
}

function makeSlug ( name: string ) {
    return slugify(name, {
        lower: true,
        remove: /[^a-zA-Z\d\s\-]/g,
    })
}

async function hasListingFile ( listing ) {
    const listingFilePath = `${ markdownStorePath }/${ makeListingEndpoint( listing ) }.md`
    return await exists( listingFilePath )
}


function cleanListings ( fetchedListings ) {
    const listings = {}

    for ( const id in fetchedListings ) {

        // Delete noisy properties
        // so we don't get a bunch of noise in our commits
        delete fetchedListings[id].popularity
        delete fetchedListings[id].vote_count
        

    }

    return fetchedListings
}

function getListingTitleForAudit ( listing: any ) {
    return String( listing?.title || listing?.name || '' )
}

function getListingDateForAudit ( listing: any ) {
    return String( listing?.release_date || listing?.first_air_date || '' )
}

function getListingTypeForAudit ( listing: any ) {
    const tags = Array.isArray( listing?.tags ) ? listing.tags : []

    if ( tags.includes( 'movie' ) ) {
        return 'movie'
    }

    if ( tags.includes( 'tv' ) ) {
        return 'tv'
    }

    return ''
}

function normalizeTitleForAudit ( title: string ) {
    return makeSlug( title )
        .replace( /^marvels-/, '' )
        .replace( /^the-/, '' )
        .replace( /^assembled-the-making-of-/, '' )
        .replace( /^marvel-studios-assembled-the-making-of-/, '' )
        .replace( /^the-making-of-/, '' )
}

function getTokenOverlapRatio ( stringA: string, stringB: string ) {
    const tokenSetA = new Set( stringA.split( '-' ).filter( Boolean ) )
    const tokenSetB = new Set( stringB.split( '-' ).filter( Boolean ) )
    const union = new Set( [ ...tokenSetA, ...tokenSetB ] )

    if ( union.size === 0 ) {
        return 0
    }

    let intersectionCount = 0

    for ( const token of tokenSetA ) {
        if ( tokenSetB.has( token ) ) {
            intersectionCount += 1
        }
    }

    return intersectionCount / union.size
}

function isSuspiciousTitleChange ( previousTitle: string, nextTitle: string ) {
    const normalizedPreviousTitle = normalizeTitleForAudit( previousTitle )
    const normalizedNextTitle = normalizeTitleForAudit( nextTitle )

    if ( normalizedPreviousTitle === normalizedNextTitle ) {
        return false
    }

    if (
        normalizedPreviousTitle.includes( normalizedNextTitle )
        || normalizedNextTitle.includes( normalizedPreviousTitle )
    ) {
        return false
    }

    return getTokenOverlapRatio( normalizedPreviousTitle, normalizedNextTitle ) < 0.5
}

async function readListingsSnapshot () {
    const listingsJsonPath = `${ storePath }/listings.json`

    if ( !( await exists( listingsJsonPath ) ) ) {
        return []
    }

    const fileContent = await Deno.readTextFile( listingsJsonPath )

    return JSON.parse( fileContent )
}

function makeTmdbRegressionReport ( previousListings: any[], nextListings: any[] ) {
    const nextListingsById = Object.fromEntries( nextListings.map( ( listing: any ) => [ listing.id, listing ] ) )

    const report: any = {
        generatedAt: new Date().toISOString(),
        counts: {
            previousListings: previousListings.length,
            nextListings: nextListings.length,
            missingIds: 0,
            titleChanges: 0,
            suspiciousTitleChanges: 0,
            typeChanges: 0,
            dateCleared: 0,
            adultFlagFlips: 0,
        },
        missingIds: [],
        titleChanges: [],
        suspiciousTitleChanges: [],
        typeChanges: [],
        dateCleared: [],
        adultFlagFlips: [],
    }

    for ( const previousListing of previousListings ) {
        const nextListing = nextListingsById[ previousListing.id ]
        const previousTitle = getListingTitleForAudit( previousListing )

        if ( !nextListing ) {
            report.missingIds.push( {
                id: previousListing.id,
                title: previousTitle,
                type: getListingTypeForAudit( previousListing ),
                date: getListingDateForAudit( previousListing ),
            } )
            continue
        }

        const nextTitle = getListingTitleForAudit( nextListing )
        const previousType = getListingTypeForAudit( previousListing )
        const nextType = getListingTypeForAudit( nextListing )
        const previousDate = getListingDateForAudit( previousListing )
        const nextDate = getListingDateForAudit( nextListing )

        if ( previousTitle !== nextTitle ) {
            const titleChange = {
                id: previousListing.id,
                previousTitle,
                nextTitle,
                previousDate,
                nextDate,
            }

            report.titleChanges.push( titleChange )

            if ( isSuspiciousTitleChange( previousTitle, nextTitle ) ) {
                report.suspiciousTitleChanges.push( titleChange )
            }
        }

        if ( previousType !== nextType ) {
            report.typeChanges.push( {
                id: previousListing.id,
                title: nextTitle || previousTitle,
                previousType,
                nextType,
            } )
        }

        if ( previousDate && !nextDate ) {
            report.dateCleared.push( {
                id: previousListing.id,
                title: nextTitle || previousTitle,
                previousDate,
            } )
        }

        if ( Boolean( previousListing?.adult ) !== Boolean( nextListing?.adult ) ) {
            report.adultFlagFlips.push( {
                id: previousListing.id,
                title: nextTitle || previousTitle,
                previousAdult: Boolean( previousListing?.adult ),
                nextAdult: Boolean( nextListing?.adult ),
            } )
        }
    }

    report.counts.missingIds = report.missingIds.length
    report.counts.titleChanges = report.titleChanges.length
    report.counts.suspiciousTitleChanges = report.suspiciousTitleChanges.length
    report.counts.typeChanges = report.typeChanges.length
    report.counts.dateCleared = report.dateCleared.length
    report.counts.adultFlagFlips = report.adultFlagFlips.length

    return report
}

async function fetchListings ({ 
    endpoint, 
    params = {},
    listKey = 'results',
    tags = []
}: FetchListingsOptions) {
    const fetchedListings = {}

    let total_pages = Infinity
    let page = 1

    while ( page <= total_pages ) {

        // console.log( 'Fetching page', company )
        // console.log( 'Page', page )

        // https://www.themoviedb.org/talk/5f84426469eb900039c48872
        const requestUrl = `https://api.themoviedb.org${ endpoint }`

        const requestOptions = {
            params: {
                api_key: Deno.env.get('TMDB_API_KEY'),
                // language: 'en-US',
                // sort_by: 'popularity.desc',
                // with_companies: company.id,
                page,

                // Merge in params
                ...params
            }
        }

        const response = await tmdbGet( requestUrl, requestOptions )

        const { data } = response

        
        for ( const result of data[ listKey ] ) {

            // If we've already seen this title, add the new company to the list
            if ( fetchedListings[ result.id ] ) {
                continue
            }

            const title = result.name || result.title
            const slug = makeSlug( title )

            fetchedListings[ result.id ] = {
                ...result,
                title,
                slug,
                tags,
            }
        }

        total_pages = data.total_pages || 1
        page += 1
    }

    return cleanListings( fetchedListings )
}

// Fetches movies from the 
async function fetchListingsFromCompanies ( companies ) {
    const listings = {}

    for ( const company of companies ) {

        const movies = await fetchListings({ 
            endpoint: `/3/discover/movie`, 
            params: { with_companies: company.id }, 
            tags: [ 'movie', `company-${ company.id }` ]
        })
        const tvShows = await fetchListings({ 
            endpoint: `/3/discover/tv`, 
            params: { with_companies: company.id }, 
            tags: [ 'tv', `company-${ company.id }` ]
        })

        // Merge into listings
        for ( const id in movies ) {
            listings[ id ] = deepmergeListings( movies[ id ], listings[ id ] || {} ) 
        }
        
        for ( const id in tvShows ) {
            listings[ id ] = deepmergeListings( tvShows[ id ], listings[ id ] || {} ) 
        }
        
    }

    // Sort movies by release_date/first_air_date and empty first
    // const sortedListings = Object.values(listings)
    //     .sort( byListingDate )

    return listings
}


async function fetchListingsFromLists ( lists ) {
    const listings = {}

    for ( const list of lists ) {

        const fetchedListings = await fetchListings({ 
            // https://api.themoviedb.org/3/list/8204859?append_to_response=videos,images,company&api_key={{API_KEY}}
            endpoint: `/3/list/${ list.id }`, 
            params: {
                append_to_response: 'videos,images,company'
            },
            tags: [ `list-${ list.id }` ], 
            listKey: 'items'
        })

        // Merge into listings
        for ( const id in fetchedListings ) {
            listings[ id ] = deepmergeListings( fetchedListings[ id ], listings[ id ] || {} ) 
        }
        
    }

    return listings//sortedListings
}


// Deno specfic markdown writer
// since Deno uses custom fs and import method for gray-matter
async function writeMarkdownFileDeno ({ path, markdownBody, pageMeta }) {

    // console.log('markdownBody', markdownBody)
    // console.log('pageMeta', pageMeta)

    const hasPageMeta = Object( pageMeta ) === pageMeta && Object.keys(pageMeta).length > 0

    // Ensure markdown body end with newline
    // markdownBody = markdownBody.endsWith( '\n' ) ? markdownBody : `${ markdownBody }\n`

    // If there is no pageMeta
    // then assume everything the body already has encoded frontmatter
    if ( !hasPageMeta ) {
        const bodyHasFrontmatter = markdownBody.startsWith('---')

        // If there is no frontmatter then throw
        if ( !bodyHasFrontmatter ) {
            throw new Error(`No frontmatter found for ${ path }`)
        }

        await Deno.writeTextFile( path, markdownBody )

        return
    }

    const markdownContent = matter.stringify( markdownBody, pageMeta )

    // console.log('markdownContent', markdownContent)
    
    await Deno.writeTextFile( path, markdownContent )
}

async function readMarkdownFileDeno ( filePath ) {
    // const markdownContent = await fs.readFile( filePath, 'utf8' )

    const markdownContent = new TextDecoder( 'utf-8' ).decode( await Deno.readFile( filePath ) )


    return await getDataFromListingContents({ 
        markdown: markdownContent, 
        matter 
    })
}

async function writeTmdbDataOnly ( listing ) {

    const listingFilePath = `${ markdownStorePath }/${ makeListingEndpoint( listing ) }.md`

    const decoder = new TextDecoder( 'utf-8' )
    const markdownContent = decoder.decode(await Deno.readFile( listingFilePath ))
    // Split off and leave behind existing TMDb data
    const { existingContent } = getPartsFromMarkdown( markdownContent )
    const tmdbSection = makeTMDbMarkdownSection( listing )

    // console.log( 'existingContent', existingContent )

    // Merge in existing meta above the current TMDb data
    const content = [
        existingContent.trim(),
        tmdbSection,
        // Ensure newline at end
        // tmdbSection.endsWith( '\n' ) ? '' : '\n'
    ].join('\n')


    await Deno.writeTextFile( listingFilePath, content )

}

async function saveListingsAsMarkdown ( listings ) {

    for ( const listing of listings ) {

        const listingFilePath = `${ markdownStorePath }/${ makeListingEndpoint( listing ) }.md`

        if ( await exists( listingFilePath ) ) {

            await writeTmdbDataOnly( listing )

            continue
        }

        await upsertListingMarkdown( {
            listing,
            tmdb: listing,
            readMarkdownFile: readMarkdownFileDeno, 
            writeMarkdownFile: writeMarkdownFileDeno,
            exists: exists
        })

    }
}

;(async () => {
    const previousListings = await readListingsSnapshot()

    const companylistings = await fetchListingsFromCompanies( TMDB_COMPANIES )

    const listListings = await fetchListingsFromLists( TMDB_LISTS )

    // console.log('listListings', listListings[ 668 ] )
    // console.log('companylistings', companylistings.find( ( listing ) => listing.id === 668 ))

    const listings = deepmergeListings( companylistings, listListings ) as Record<string, unknown>

    // console.log('listings', listings[ 668 ])

    // Sort movies by release_date/first_air_date and empty first
    const sortedListings = Object.values(listings)
        .sort( byPremiere )

    const tmdbRegressionReport = makeTmdbRegressionReport( previousListings, sortedListings )

    await writeJSON( `${ storePath }/tmdb-regression-report.json`, tmdbRegressionReport, null, '\t' )

    if ( tmdbRegressionReport.counts.missingIds > 0 || tmdbRegressionReport.counts.suspiciousTitleChanges > 0 ) {
        console.warn( 'TMDB regression audit detected changes that need review.', tmdbRegressionReport.counts )
    }

    await writeJSON( `${ storePath }/listings.json`, sortedListings, null, '\t' )

    await saveListingsAsMarkdown( sortedListings )

    console.log('Pull complete.')

    Deno.exit()

})()
