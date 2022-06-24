import { deepmerge } from 'deepmerge-ts'

import { 
    getYearAndMonth, 
    makeSlug,
// @ts-ignore
} from '~/src/helpers/node/listing.ts'

function parseOrderedTitle ( rawTitle:string ) {
    const [
        listingTitle,
        seasonParts = ''
    ] = rawTitle.split( ' Season ' )

    const [
        seasonNumber = '',
        episodeParts = ''
    ] = seasonParts.split( ' Episode ' )

    const [
        episodeNumber = '',
        episodeTitle = ''
    ] = episodeParts.split( ': ' )

    return {
        listingTitle,
        seasonNumber,
        episodeNumber,
        episodeTitle
    }
}



export function matchListingToOrdered ( listing, orderedEntry ) {

    // Skip if listing has no release date
    if ( !listing.dateString ) {
        return false
    }

    // console.log( 'listing.dateString', listing.dateString )
    // console.log( 'orderedEntry.premiereDate', orderedEntry.premiereDate )
    const dateMatches = getYearAndMonth( orderedEntry.premiereDate ) === getYearAndMonth( listing.dateString )

    if ( !dateMatches ) return false


    const listingSlug = makeSlug( listing.title )
    const orderedSlug = makeSlug( orderedEntry.title )

    // console.log( 'listingSlug', listingSlug )
    // console.log( 'orderedSlug', orderedSlug )

    return listingSlug.includes( orderedSlug )
}


export function organizeOrderData ( rawOrderData:Array<any> ) {
    const organizedOrder = {}

    for ( const [ mcuTimelineOrder, entry ] of rawOrderData.entries() ) {
        const {
            TYPE,
            TITLE,
            RELEASE_DATE,
            // NOTES
        } = entry

        const {
            listingTitle,
            seasonNumber,
            episodeNumber,
            episodeTitle
        } = parseOrderedTitle( TITLE )
        
        const existingData = organizedOrder[ listingTitle ] || {}

        const entryData:any = {
            title: listingTitle,
        }

        // If we don't have a premiere date
        // set the first date as premiere date
        if ( !existingData?.premiereDate ) {
            entryData.mcuTimelineOrder = mcuTimelineOrder
            entryData.premiereDate = RELEASE_DATE
            entryData.timelineType = makeSlug( TYPE )
        }

        if ( seasonNumber.length > 0 ) {
            const existingEpisodeCount = existingData.seasons?.[seasonNumber]?.episodeCount || 0

            entryData.seasons = {
                [seasonNumber]: {
                    episodeCount: existingEpisodeCount + 1,
                    episodes: {
                        [episodeNumber]: {
                            title: episodeTitle,
                            premiereDate: RELEASE_DATE,
                            mcuTimelineOrder
                        }
                    }
                }
            }

            // If this is epsiode 1, add it's date as the season's release date
            if ( episodeNumber === '1' ) {
                entryData.seasons[seasonNumber].mcuTimelineOrder = mcuTimelineOrder
                entryData.seasons[seasonNumber].premiereDate = RELEASE_DATE
            }

        }

        // Merge new data with existing data
        organizedOrder[ listingTitle ] = deepmerge( existingData, entryData )
    }


    return organizedOrder
}