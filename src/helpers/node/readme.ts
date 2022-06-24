import fs from 'fs-extra'

// @ts-ignore
import { Listing } from '~/src/helpers/types.ts'

import {
    getInUniverseTimelineAndListings
// @ts-ignore
} from '~/src/helpers/node/in-universe-timeline.ts'

export function updateMarkdownContent ( options:any = {} ) {
    const {
        sourceMarkdown, 
        newMarkdown,
        markerString
    } = options

    const startMarker = `<!-- start-${ markerString } -->`
    const endMarker = `<!-- end-${ markerString } -->`

    // Throw if start or end marker is not found
    if ( !sourceMarkdown.includes( startMarker ) || !sourceMarkdown.includes( endMarker ) ) {
        throw new Error( `Missing start or end marker for ${ markerString }` )
    }

    const startIndex = sourceMarkdown.indexOf( startMarker ) + startMarker.length
    const endIndex = sourceMarkdown.indexOf( endMarker )

    const newReadmeListContent = [
        sourceMarkdown.slice( 0, startIndex ),
        newMarkdown,
        sourceMarkdown.slice( endIndex )
    ].join('')

    return newReadmeListContent
}

export function makeUpcomingListingsMarkdown ( upcomingListings: Listing[] ) {

    const markdownLines = upcomingListings.map( ( mappedListing: Listing ) => {

        // console.log( 'mappedListing.date', mappedListing.date )

        const lineParts = [
            '', 
            mappedListing.date.toLocaleString({ month: 'long', day: 'numeric', year: 'numeric' }),
            `[${ mappedListing.title }](https://marvelorder.com${ mappedListing.endpoint })`,
            // typesReadmeMap[ timelineType ],
            `[Edit](${ mappedListing.githubEditUrl })`
        ]
        
        return lineParts.join( ' - ' ).trim()
    })

    return '\n\n' + markdownLines.join( '\n' ) + '\n\n'
}

export async function updateReadmeListContent ( newListMarkdown: string, markerString: string ) {

    // Get README.md content
    const readmeContent = await fs.readFile( './README.md', 'utf8' )

    // console.log( 'readmeContent', readmeContent )

    const newReadmeListContent = updateMarkdownContent({
        sourceMarkdown: readmeContent,
        newMarkdown: newListMarkdown,
        markerString
    })

    // console.log( 'newReadmeListContent', newReadmeListContent )

    await fs.writeFile( './README.md', newReadmeListContent )

    return newReadmeListContent
}


const inUniverseTypeMap = {
    'series': '📺 Series',
    'movie': '🎬 Movie',
    'short-form': '▶️ Short',
}

export async function makeInUniverseMarkdown () {
    const timeline = await getInUniverseTimelineAndListings()

    // console.log( 'timeline', timeline[0] )

    const markdownLines = timeline.map( ( timelineEntry:any, index:number ) => {
        
        const { 
            inUniverseEntry = null as any, 
            mappedListing = null as Listing 
        } = timelineEntry

        // console.log( 'inUniverseEntry', inUniverseEntry )

        const lineParts = [
            '', 
            `<kbd>${ index + 1 }</kbd>`,
            // mappedListing.date.toLocaleString({ month: 'long', day: 'numeric', year: 'numeric' }),
            `[${ mappedListing.title }](https://marvelorder.com${ mappedListing.endpoint })`,
            inUniverseTypeMap[ inUniverseEntry.type ] || '⁇',
            `[Edit](${ mappedListing.githubEditUrl })`
        ]
        
        return lineParts.join( ' - ' ).trim()
    })

    return '\n\n' + markdownLines.join( '\n' ) + '\n\n'
}