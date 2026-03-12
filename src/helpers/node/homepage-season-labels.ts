import fs from 'fs-extra'
import { resolve } from 'node:path'

import type { Listing, MCUTimelineSheetRecord } from '~/src/helpers/types.ts'
import {
    organizeOrderData,
} from '~/src/helpers/node/mcu-timeline-sheet.ts'
import {
    normalizeTitleForTimelineMatch,
} from '~/src/helpers/node/timeline-matcher.ts'

let cachedHomepageSeasonLabelsPromise: Promise<Map<string, string>> | null = null

function getTimelineSheetPath () {
    return resolve( process.cwd(), 'src/json/mcu-timeline-sheet.json' )
}

export async function getHomepageSeasonLabelByTitle () {
    if ( cachedHomepageSeasonLabelsPromise ) {
        return cachedHomepageSeasonLabelsPromise
    }

    cachedHomepageSeasonLabelsPromise = fs.readJson( getTimelineSheetPath() )
        .then( ( rawTimelineSheet: {
            records?: MCUTimelineSheetRecord[]
        } ) => {
            const organizedTimeline = organizeOrderData( rawTimelineSheet.records || [] )
            const seasonLabelByTitle = new Map<string, string>()

            for ( const [ title, orderedEntry ] of Object.entries( organizedTimeline ) ) {
                const seasonNumbers = Object.keys( ( orderedEntry as {
                    seasons?: Record<string, unknown>
                } ).seasons || {} )
                    .sort( ( seasonA, seasonB ) => Number( seasonA ) - Number( seasonB ) )

                if ( seasonNumbers.length < 2 ) {
                    continue
                }

                seasonLabelByTitle.set(
                    normalizeTitleForTimelineMatch( title ),
                    seasonNumbers.map( seasonNumber => `Season ${ seasonNumber }` ).join( ', ' ),
                )
            }

            return seasonLabelByTitle
        } )

    return cachedHomepageSeasonLabelsPromise
}

export function getHomepageSeasonLabel (
    listing: Pick<Listing, 'title'>,
    seasonLabelByTitle: Map<string, string>,
) {
    return seasonLabelByTitle.get( normalizeTitleForTimelineMatch( listing.title || '' ) ) || ''
}
