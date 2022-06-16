
import { 
    storePath 
// @ts-ignore
} from '../config.ts'
// @ts-ignore
import { Listing } from './types.ts'
// @ts-ignore
import { makeListingEndpoint } from './listing.ts'

export const tmdbHeading = `## TMDB Data`

export function makeTMDbMarkdownSection ( listing:Listing ) {
    const detailsJSON = JSON.stringify( listing, null, 4 )

    return [
        tmdbHeading, 
        '```json',
        detailsJSON,
        '\n```'
    ].join('\n')
}

interface ListingContentsOptions {
    // These are't fully fledged listings,
    // since they don't have all the data yet on their own
    listing:object
    tmdb:object
}

export function makeNewListingContents ( options:ListingContentsOptions ) {

    // Any type since we're pulling in unknown data
    // https://stackoverflow.com/a/57376029/1397641
    const { 
        listing = {} as any, 
        tmdb = {} as any 
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
        pageMeta
    }
}

export function getPartsFromMarkdown ( markdown: string ) {
    const [ existingContent, tmdbContent ] = markdown.split( tmdbHeading )

    return {
        existingContent, 
        tmdbContent
    }
}

export function parseTMDbMarkdown ( tmdbContent: string ) {
    const lines = tmdbContent.split('\n')

    // Get index of the opening JSON ticks
    const openingTicksIndex = lines.findIndex( line => line.trim() === '```json' )

    // Get index of the closing JSON ticks
    const closingTicksIndex = lines.findIndex( line => line.trim() === '```' )

    // Get the JSON string
    const jsonString = lines.slice( openingTicksIndex + 1, closingTicksIndex ).join('\n')

    // Parse the JSON
    return JSON.parse( jsonString )
}


export async function upsertListingMarkdown ( options:any ) {
    const {
        listing = {} as any,
        readFile,
        writeMarkdownFile,
        exists
    } = options


    const filePath = `${ storePath }/${ makeListingEndpoint( listing ) }.md`
    const hasExistingFile = await exists( filePath )

    let markdownBody = ''
    let pageMeta = null
    
    // If there's no existing file, create one with meta data from our listing
    if ( hasExistingFile ) {
        const markdownContent = await readFile( filePath )
        // Split off and leave behind existing TMDb data
        const { existingContent } = getPartsFromMarkdown( markdownContent )

        // Merge in existing meta above the current TMDb data
        markdownBody = [
            existingContent.trim(),
            makeTMDbMarkdownSection( listing )
        ].join('\n')

    } else {
        // const {
        //     markdownBody,
        //     pageMeta
        // }
        
        const newContents = await makeNewListingContents({ 
            listing: {
                title: listing.title,
                slug: listing.slug,
                description: listing.overview,
            },
            tmdb: listing
        })

        markdownBody = newContents.markdownBody
        pageMeta = newContents.pageMeta

        // console.log('markdownBody', markdownBody)
        // console.log('pageMeta', pageMeta)

        // content = matter.stringify( markdownBody, pageMeta )
    }

    await writeMarkdownFile( {
        path: filePath, 
        markdownBody, 
        pageMeta
    } )
}