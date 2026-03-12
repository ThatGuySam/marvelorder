import type { Listing } from '~/src/helpers/types.ts'

import {
    FilteredListings,
    isMCU,
    isMcuSheetOrdered,
} from '~/src/helpers/listing-filters.ts'
import { getAllListings } from '~/src/helpers/node/listing-files.ts'
import { canonicalizeTimelineListings } from '~/src/helpers/node/timeline-matcher.ts'

function getRawListings ( filteredListings: FilteredListings ): Listing[] {
    return filteredListings.list.map( listing => listing.sourceListing )
}

export async function getPublicMcuReleaseListings () {
    const allListings = await getAllListings()

    const filteredListings = new FilteredListings( {
        listings: allListings,
        initialFilters: new Map( [
            [ isMCU, true ],
        ] ),
        listingsSort: 'default',
    } )

    return canonicalizeTimelineListings( getRawListings( filteredListings ), {
        collapseUndatedTitles: true,
    } )
}

export async function getPublicMcuTimelineListings () {
    const allListings = await getAllListings()

    const filteredListings = new FilteredListings( {
        listings: allListings,
        initialFilters: new Map( [
            [ isMcuSheetOrdered, true ],
        ] ),
        listingsSort: 'none',
    } )

    return canonicalizeTimelineListings( getRawListings( filteredListings ) )
}
