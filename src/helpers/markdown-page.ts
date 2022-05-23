
// @ts-ignore
import { Listing } from './types.ts'

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

export function makeNewListingContents ( listing:Listing ) {
    const pageMeta = {
        title: listing.title, 
        slug: listing.slug, 
        description: listing.overview, 
        type: listing.type, 
        layout: '../../layouts/MainLayout.astro',
    }

    const wrappedCode = makeTMDbMarkdownSection( listing )

    return {
        wrappedCode,
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