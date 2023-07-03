import {
    markdownStorePath,
// @ts-expect-error
} from '../config.ts'

// @ts-expect-error
import type { Listing } from './types.ts'
import {
    makeListingEndpoint,
// @ts-expect-error
} from './listing.ts'

export const tmdbHeading = '## TMDB Data' as const

export function makeTMDbMarkdownSection ( listing: Listing ) {
    const detailsJSON = JSON.stringify( listing, null, 4 )

    return [
        tmdbHeading,
        '```json',
        detailsJSON,
        '\n```',
    ].join( '\n' )
}

interface ListingContentsOptions {
    // These are't fully fledged listings,
    // since they don't have all the data yet on their own
    listing: object
    tmdb: object
}

export function makeNewListingContents ( options: ListingContentsOptions ) {
    // Any type since we're pulling in unknown data
    // https://stackoverflow.com/a/57376029/1397641
    const {
        listing = {} as any,
        tmdb = {} as any,
    } = options

    const pageMeta = {
        title: listing.title,
        slug: listing.slug,
        description: listing?.description || tmdb?.overview || '',
        // type: listing.type,
        layout: '../../layouts/MainLayout.astro',

        // Merge in any other initial listing data
        ...listing,
    }

    const hasTMDbData = Object.keys( tmdb ).length > 0

    const wrappedTmdbCode = hasTMDbData ? makeTMDbMarkdownSection( tmdb ) : ''

    return {
        markdownBody: wrappedTmdbCode,
        pageMeta,
    }
}

export function getPartsFromMarkdown ( markdown: string ) {
    const [
        existingContent,
        tmdbContent = '',
    ] = markdown.split( tmdbHeading )

    return {
        existingContent,
        tmdbContent,
    }
}

export function parseTMDbMarkdown ( tmdbContent: string ) {
    const lines = tmdbContent.split( '\n' )

    // Get index of the opening JSON ticks
    const openingTicksIndex = lines.findIndex( line => line.trim() === '```json' )

    // Get index of the closing JSON ticks
    const closingTicksIndex = lines.findIndex( line => line.trim() === '```' )

    // Get the JSON string
    const jsonString = lines.slice( openingTicksIndex + 1, closingTicksIndex ).join( '\n' )

    // Parse the JSON
    return JSON.parse( jsonString )
}

function getUpdatedProperties ( oldObject: any, newObject: any, mergeArrays = false ) {
    const difference: any = {}

    for ( const key of Object.keys( newObject ) ) {
        const value = newObject[ key ]

        const existingValueJson = JSON.stringify( oldObject[ key ] )
        const newValueJson = JSON.stringify( value )

        if ( existingValueJson !== newValueJson ) {
            // console.log( 'newListingData', key, value, oldObject[ key ] )

            // If the old value is an array
            // and the new value is an array
            // then let merge them in
            // but with a Set to remove duplicates
            if ( mergeArrays && Array.isArray( oldObject[ key ] ) && Array.isArray( value ) ) {
                difference[ key ] = [ ...new Set( oldObject[ key ].concat( value ) ) ]
                continue
            }

            difference[ key ] = value
        }
    }

    return difference
}

export function getDataFromListingContents ( options: any ) {
    const {
        markdown,
        matter,
    } = options

    const { tmdbContent } = getPartsFromMarkdown( markdown )

    const frontmatter = matter( markdown ).data
    const tmdb = parseTMDbMarkdown( tmdbContent )

    return {
        // Merge letting the frontmatter take precedence
        listing: {
            ...tmdb,
            ...frontmatter,
        },
        frontmatter,
        tmdb,
    }
}

export async function upsertListingMarkdown ( options: any ) {
    const {
        listing = {} as any,
        tmdb = {} as any,
        readMarkdownFile,
        writeMarkdownFile,
        exists,

        // This is so that tmdb can remove things like genreId
        // while in other places we can merge in things like tags
        mergeArrays = false,
    } = options

    const filePath = `${ markdownStorePath }/${ makeListingEndpoint( listing ) }.md`
    const hasExistingFile = await exists( filePath )

    let markdownBody = ''
    let pageMeta = null

    const existingListingDetails
        = hasExistingFile
            ? await readMarkdownFile( filePath )
            : { frontmatter: {}, tmdb: {}, listing: {} }

    const newListingData = getUpdatedProperties( existingListingDetails.listing, listing, mergeArrays )

    // console.log( 'newListingData', newListingData )

    const newContents = await makeNewListingContents( {
        listing: {
            ...existingListingDetails.frontmatter,

            title: listing.title,
            slug: listing.slug,
            description: listing.overview,

            ...newListingData,
        },
        tmdb: {
            ...existingListingDetails.tmdb,
            // ...listing,
            ...tmdb,
        },
    } )

    markdownBody = newContents.markdownBody
    pageMeta = newContents.pageMeta

    // console.log( 'markdownBody', markdownBody )

    await writeMarkdownFile( {
        path: filePath,
        markdownBody,
        pageMeta,
    } )
}
