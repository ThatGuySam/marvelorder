import 'dotenv/config'
import axios from 'axios'

import {
    findBestTimelineListingMatch,
    getExpectedMediaTypeFromInUniverseEntry,
    matchesTimelineListing,
} from '~/src/helpers/node/timeline-matcher.ts'

import {
    getAllListings,
} from '~/src/helpers/node/listing-files.ts'

import {
    FilteredListings,
    isDoc,
    isMarvelKnightsAnimated,
} from '~/src/helpers/listing-filters.ts'

const inUniverseFirstPage = '/CuratedSet/version/5.1/region/US/audience/k-false,l-true/maturity/1450/language/en/setId/9466a148-f6b4-4c1a-8028-b0129323f4a9/pageSize/15/page/1'
const defaultDisneyApiPrefix = 'https://disney.content.edge.bamgrid.com/svc/content'

interface TitleEntry {
    default: {
        content: string
        language: 'en'
        sourceEntity: 'program' | 'set' | 'series'
    }
}

interface TitleText {
    program?: TitleEntry
    series?: TitleEntry
}

interface DisneyPlusRelease {
    releaseDate: `${ number }-${ number }-${ number }`
    releaseOrg: null
    releaseType: 'original'
    releaseYear: number
    territory: null
}

type SeriesType = 'standard' | null
type ProgramType = 'movie' | 'short-form'

interface DisneyPlusInUniverseItem {
    contentId: string
    seriesType?: SeriesType
    programType?: ProgramType
    text: {
        title: {
            full: TitleText
            slug: TitleText
        }
    }
    releases: DisneyPlusRelease[]
}

interface DisneyPlusInUniverseEntry {
    contentId: string
    title: string
    slug: string
    releases: DisneyPlusRelease[]
    seriesType?: SeriesType
    type: 'series' | ProgramType
}

let inUniverseTimelinePromise: Promise<DisneyPlusInUniverseEntry[]> | null = null
let inUniverseListingsPromise: Promise<Awaited<ReturnType<typeof loadInUniverseListings>>> | null = null
let inUniverseTimelineAndListingsPromise: Promise<Array<{ inUniverseEntry: DisneyPlusInUniverseEntry, mappedListing: any }>> | null = null

function mapCuratedSetItem ( item: DisneyPlusInUniverseItem ): DisneyPlusInUniverseEntry {
    const isSeries = !!item?.seriesType
    const programOrSeries = isSeries ? 'series' : 'program'
    const titleObject = item.text.title

    return {
        contentId: item.contentId,
        title: titleObject.full[ programOrSeries ].default.content,
        slug: titleObject.slug[ programOrSeries ].default.content,
        releases: item.releases,
        seriesType: item?.seriesType,
        type: isSeries ? 'series' : item.programType,
    }
}

function getDisneyApiPrefix () {
    const prefix = process.env.DISNEY_API_PREFIX?.trim()

    return prefix && prefix.length > 0
        ? prefix
        : defaultDisneyApiPrefix
}

export async function getInUniverseTimeline (): Promise<DisneyPlusInUniverseEntry[]> {
    if ( !inUniverseTimelinePromise ) {
        inUniverseTimelinePromise = ( async () => {
            let pageTotal = Number.POSITIVE_INFINITY
            let pageIndex = 1

            const allItems: DisneyPlusInUniverseEntry[] = []
            const disneyApiPrefix = getDisneyApiPrefix()

            while ( pageTotal > 0 ) {
                const pageUrl = `${ disneyApiPrefix }${ inUniverseFirstPage.replace( '/page/1', `/page/${ pageIndex }` ) }`
                const page = await axios( pageUrl ).then( res => res.data )

                const items = page.data.CuratedSet.items.map( mapCuratedSetItem )

                allItems.push( ...items )

                pageTotal = items.length
                pageIndex++
            }

            return allItems
        } )().catch( ( error ) => {
            inUniverseTimelinePromise = null
            throw error
        } )
    }

    return inUniverseTimelinePromise
}

export function matchListingToInUniverse ( listing, inUniverseEntry ) {
    const cleanInUniverseTitle = inUniverseEntry.title
        // Replace Trademark Symbols
        .replaceAll( '™', '' )

    return matchesTimelineListing( listing, {
        title: cleanInUniverseTitle,
        date: inUniverseEntry.releases[ 0 ].releaseDate,
        expectedMediaType: getExpectedMediaTypeFromInUniverseEntry( inUniverseEntry ),
        dayTolerance: 1,
    } )
}

export function matchTimelineEntryToSavedListing ( inUniverseEntry: any, savedListings: any[] ) {
    const matchingListing = findBestTimelineListingMatch( savedListings, {
        title: inUniverseEntry.title.replaceAll( '™', '' ),
        date: inUniverseEntry.releases[ 0 ].releaseDate,
        expectedMediaType: getExpectedMediaTypeFromInUniverseEntry( inUniverseEntry ),
        dayTolerance: 1,
        allowTitleOnlyFallback: true,
    } )

    if ( matchingListing ) {
        return matchingListing
    }

    throw new Error( `Could not match timeline entry to saved listing: ${ inUniverseEntry.title }` )
}

const inUniverseFilters = new Map( [
    [
        isDoc,
        {
            targetValue: false,
        },
    ],
    [
        isMarvelKnightsAnimated,
        {
            targetValue: false,
        },
    ],
] )

async function loadInUniverseListings () {
    const rawListings = await getAllListings()

    const inUniverseListings = new FilteredListings( {
        listings: rawListings,
        initialFilters: inUniverseFilters,
        useDefaultFilters: false,
        listingsSort: 'default',
    } )

    return inUniverseListings.list
}

async function getInUniverseListings () {
    if ( !inUniverseListingsPromise ) {
        inUniverseListingsPromise = loadInUniverseListings().catch( ( error ) => {
            inUniverseListingsPromise = null
            throw error
        } )
    }

    return inUniverseListingsPromise
}

export async function getInUniverseTimelineAndListings () {
    if ( !inUniverseTimelineAndListingsPromise ) {
        inUniverseTimelineAndListingsPromise = ( async () => {
            const universeTimeline = await getInUniverseTimeline()
            const savedListings = await getInUniverseListings()

            const matches = new Map()

            for ( const inUniverseEntry of universeTimeline ) {
                const matchingListing = matchTimelineEntryToSavedListing( inUniverseEntry, savedListings )

                matches.set( matchingListing.id, {
                    inUniverseEntry,
                    mappedListing: matchingListing,
                } )
            }

            return Array.from( matches.values() )
        } )().catch( ( error ) => {
            inUniverseTimelineAndListingsPromise = null
            throw error
        } )
    }

    return inUniverseTimelineAndListingsPromise
}
