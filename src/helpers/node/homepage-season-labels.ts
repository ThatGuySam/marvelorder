import fs from 'fs-extra'
import { resolve } from 'node:path'

import type { Listing, MCUTimelineSheetRecord } from '~/src/helpers/types.ts'
import {
    normalizeListingDateValue,
} from '~/src/helpers/listing.ts'
import {
    organizeOrderData,
} from '~/src/helpers/node/mcu-timeline-sheet.ts'
import {
    normalizeTitleForTimelineMatch,
} from '~/src/helpers/node/timeline-matcher.ts'

export interface HomepageSeasonObservation {
    label: string
    mcuTimelineOrder?: number
    premiereDate: string
    seasonNumber: string
}

let cachedHomepageSeasonObservationsPromise: Promise<Map<string, HomepageSeasonObservation[]>> | null = null

function getTimelineSheetPath () {
    return resolve( process.cwd(), 'src/json/mcu-timeline-sheet.json' )
}

function normalizeHomepageSeasonDate ( dateValue: unknown ) {
    const normalizedDate = normalizeListingDateValue( dateValue as string | Date )

    if ( normalizedDate.length === 0 ) {
        return ''
    }

    const parsedDate = Date.parse( normalizedDate )

    if ( Number.isFinite( parsedDate ) ) {
        return new Date( parsedDate ).toISOString().slice( 0, 10 )
    }

    return normalizedDate.slice( 0, 10 )
}

export async function getHomepageSeasonObservationsByTitle () {
    if ( cachedHomepageSeasonObservationsPromise ) {
        return cachedHomepageSeasonObservationsPromise
    }

    cachedHomepageSeasonObservationsPromise = fs.readJson( getTimelineSheetPath() )
        .then( ( rawTimelineSheet: {
            records?: MCUTimelineSheetRecord[]
        } ) => {
            const organizedTimeline = organizeOrderData( rawTimelineSheet.records || [] )
            const seasonObservationsByTitle = new Map<string, HomepageSeasonObservation[]>()

            for ( const [ title, orderedEntry ] of Object.entries( organizedTimeline ) ) {
                const seasons = Object.entries( ( orderedEntry as {
                    seasons?: Record<string, {
                        mcuTimelineOrder?: number
                        premiereDate?: string | Date
                    }>
                } ).seasons || {} )
                    .sort( ( [ seasonA ], [ seasonB ] ) => Number( seasonA ) - Number( seasonB ) )
                    .map( ( [ seasonNumber, seasonData ] ) => {
                        const premiereDate = normalizeHomepageSeasonDate( seasonData?.premiereDate )

                        if ( premiereDate.length === 0 ) {
                            return null
                        }

                        return {
                            label: `Season ${ seasonNumber }`,
                            mcuTimelineOrder: seasonData?.mcuTimelineOrder,
                            premiereDate,
                            seasonNumber,
                        }
                    } )
                    .filter( Boolean ) as HomepageSeasonObservation[]

                if ( seasons.length === 0 ) {
                    continue
                }

                seasonObservationsByTitle.set(
                    normalizeTitleForTimelineMatch( title ),
                    seasons,
                )
            }

            return seasonObservationsByTitle
        } )

    return cachedHomepageSeasonObservationsPromise
}

export function getHomepageSeasonObservations (
    listing: Pick<Listing, 'title'>,
    seasonObservationsByTitle: Map<string, HomepageSeasonObservation[]>,
) {
    return seasonObservationsByTitle.get( normalizeTitleForTimelineMatch( listing.title || '' ) ) || []
}
