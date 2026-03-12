import fs from 'fs-extra'
import { resolve } from 'node:path'

import {
    FilteredListings,
    isGrootEpisode,
} from '~/src/helpers/listing-filters.ts'
import {
    normalizeListingDateValue,
} from '~/src/helpers/listing.ts'
import {
    getCanonicalTimelineListingKey,
    normalizeTitleForTimelineMatch,
} from '~/src/helpers/node/timeline-matcher.ts'
import type { Listing } from '~/src/helpers/types.ts'

import { getAllListings } from './listing-files.ts'

const homepageAltCutTerms = [
    'more fun stuff version',
    'in color',
] as const

const homepageKidsTerms = [
    'lego',
    'awesome friends',
    'mightiest friends',
    'avengers team-up',
] as const

const homepageCollectionTerms = [ 'collection' ] as const

const homepageSeriesRollupTitles = new Set( [
    'i-am-groot',
] )

const placeholderSequelPattern = /^(avengers|black panther|doctor strange|spider-man|thor)\s+[ivx0-9]+$/i
const placeholderTitlePattern = /^(the mutants|the legendary star-lord|el muerto|mephisto|nova|wakanda|the scarlet witch)$/i

let cachedSnapshotTitleByIdPromise: Promise<Map<number, string>> | null = null

function getSnapshotListingsPath () {
    return resolve( process.cwd(), 'src/json/listings.json' )
}

async function getSnapshotTitleById () {
    if ( cachedSnapshotTitleByIdPromise ) {
        return cachedSnapshotTitleByIdPromise
    }

    cachedSnapshotTitleByIdPromise = fs.readJson( getSnapshotListingsPath() )
        .then( ( snapshotListings: Array<{
            id?: number
            title?: string
            name?: string
        }> ) => {
            return new Map(
                snapshotListings
                    .filter( ( listing ) => typeof listing?.id === 'number' )
                    .map( ( listing ) => [
                        listing.id as number,
                        normalizeTitleForTimelineMatch( listing.title || listing.name || '' ),
                    ] ),
            )
        } )

    return cachedSnapshotTitleByIdPromise
}

function getNormalizedHomepageTitle ( listing: Pick<Listing, 'title'> ) {
    return normalizeTitleForTimelineMatch( listing.title || '' )
}

function hasHomepageLogo ( listing: Pick<Listing, 'logo_on_black'> ) {
    return typeof listing?.logo_on_black === 'string' && listing.logo_on_black.length > 0
}

function getHomepageDateString ( listing: Pick<Listing, 'release_date' | 'first_air_date'> ) {
    return normalizeListingDateValue( listing.release_date || listing.first_air_date )
}

function getSnapshotNormalizedTitle (
    listing: Pick<Listing, 'id'>,
    snapshotTitleById: Map<number, string>,
) {
    if ( typeof listing.id !== 'number' ) {
        return ''
    }

    return snapshotTitleById.get( listing.id ) || ''
}

function isHomepageAltCut ( listing: Pick<Listing, 'title'> ) {
    const lowerTitle = listing.title.toLowerCase()

    return homepageAltCutTerms.some( ( term ) => lowerTitle.includes( term ) )
}

function isHomepageKidsEntry ( listing: Pick<Listing, 'title'> ) {
    const lowerTitle = listing.title.toLowerCase()

    return homepageKidsTerms.some( ( term ) => lowerTitle.includes( term ) )
}

function isHomepageCollectionEntry ( listing: Pick<Listing, 'title'> ) {
    const lowerTitle = listing.title.toLowerCase()

    return homepageCollectionTerms.some( ( term ) => lowerTitle.includes( term ) )
}

function isHomepageWhatIfEpisode ( listing: Pick<Listing, 'title'> ) {
    const lowerTitle = listing.title.toLowerCase()

    return lowerTitle.startsWith( 'what if...' ) && lowerTitle !== 'what if...?'
}

function isHomepageFuturePlaceholderTitle ( listing: Pick<Listing, 'title'> ) {
    if ( listing.title.toLowerCase().startsWith( 'untitled' ) ) {
        return true
    }

    if ( /\b(collection|big hats)\b/i.test( listing.title ) ) {
        return true
    }

    if ( placeholderSequelPattern.test( listing.title ) ) {
        return true
    }

    return placeholderTitlePattern.test( listing.title )
}

function isHomepageReleasedLowConfidenceJunk (
    listing: Pick<Listing, 'description' | 'id' | 'overview' | 'release_date' | 'first_air_date' | 'title' | 'vote_average'>,
    snapshotTitleById: Map<number, string>,
    now = new Date(),
) {
    const date = getHomepageDateString( listing )

    if ( date.length === 0 ) {
        return false
    }

    const releaseTime = Date.parse( date )

    if ( Number.isNaN( releaseTime ) || releaseTime > Number( now ) ) {
        return false
    }

    return !listing.description
        && !listing.overview
        && Number( listing.vote_average || 0 ) === 0
        && getSnapshotNormalizedTitle( listing, snapshotTitleById ).length === 0
}

function isUndated ( listing: Pick<Listing, 'release_date' | 'first_air_date'> ) {
    return getHomepageDateString( listing ).trim().length === 0
}

function isFutureDated (
    listing: Pick<Listing, 'release_date' | 'first_air_date'>,
    now = new Date(),
) {
    const date = getHomepageDateString( listing )

    if ( date.length === 0 ) {
        return false
    }

    const releaseTime = Date.parse( date )

    return Number.isFinite( releaseTime ) && releaseTime > Number( now )
}

function isHomepageFutureLowConfidence (
    listing: Pick<Listing, 'id' | 'logo_on_black' | 'release_date' | 'first_air_date' | 'title' | 'vote_average'>,
    snapshotTitleById: Map<number, string>,
    now = new Date(),
) {
    if ( !( isUndated( listing ) || isFutureDated( listing, now ) ) ) {
        return false
    }

    if ( isHomepageFuturePlaceholderTitle( listing ) ) {
        return true
    }

    const snapshotTitle = getSnapshotNormalizedTitle( listing, snapshotTitleById )
    const isSnapshotAligned = snapshotTitle.length > 0 && getNormalizedHomepageTitle( listing ) === snapshotTitle

    return !isSnapshotAligned
        && Number( listing.vote_average || 0 ) === 0
        && !hasHomepageLogo( listing )
}

function shouldKeepHomepageListing (
    listing: Listing,
    snapshotTitleById: Map<number, string>,
    now = new Date(),
) {
    if ( isHomepageAltCut( listing ) ) {
        return false
    }

    if ( isHomepageKidsEntry( listing ) ) {
        return false
    }

    if ( isHomepageCollectionEntry( listing ) ) {
        return false
    }

    if ( isHomepageWhatIfEpisode( listing ) ) {
        return false
    }

    if ( isGrootEpisode( listing ) ) {
        return false
    }

    if ( isHomepageReleasedLowConfidenceJunk( listing, snapshotTitleById, now ) ) {
        return false
    }

    if ( isHomepageFutureLowConfidence( listing, snapshotTitleById, now ) ) {
        return false
    }

    return true
}

function scoreHomepageListingCandidate (
    listing: Listing,
    snapshotTitleById: Map<number, string>,
) {
    let score = 0
    const snapshotTitle = getSnapshotNormalizedTitle( listing, snapshotTitleById )
    const normalizedTitle = getNormalizedHomepageTitle( listing )
    const date = getHomepageDateString( listing )

    if ( snapshotTitle.length > 0 && normalizedTitle === snapshotTitle ) {
        score += 1_000
    }

    if ( date.length > 0 ) {
        score += date.length >= 7 ? 120 : 80
    }

    if ( hasHomepageLogo( listing ) ) {
        score += 40
    }

    if ( listing.type === 'tv' ) {
        score += 20
    }

    if ( Array.isArray( listing.tags ) ) {
        if ( listing.tags.includes( 'tv' ) ) {
            score += 12
        }

        if ( listing.tags.includes( 'movie' ) ) {
            score += 8
        }

        if ( listing.tags.includes( 'company-420' ) ) {
            score += 4
        }
    }

    if ( typeof listing.vote_average === 'number' ) {
        score += Math.max( 0, Math.min( listing.vote_average, 10 ) )
    }

    if ( isHomepageFuturePlaceholderTitle( listing ) ) {
        score -= 150
    }

    return score
}

function mergeHomepageListingGroup (
    listings: Listing[],
    snapshotTitleById: Map<number, string>,
) {
    const sortedListings = [ ...listings ].sort( ( listingA, listingB ) => {
        return scoreHomepageListingCandidate( listingB, snapshotTitleById ) - scoreHomepageListingCandidate( listingA, snapshotTitleById )
    } )

    const [
        primaryListing,
        ...otherListings
    ] = sortedListings

    const mergedListing: Listing = {
        ...primaryListing,
        tags: Array.from( new Set( primaryListing.tags || [] ) ),
    }

    for ( const listing of otherListings ) {
        if ( !mergedListing.logo_on_black && listing.logo_on_black ) {
            mergedListing.logo_on_black = listing.logo_on_black
        }

        if ( typeof mergedListing.mcuTimelineOrder !== 'number' && typeof listing.mcuTimelineOrder === 'number' ) {
            mergedListing.mcuTimelineOrder = listing.mcuTimelineOrder
        }

        if ( !mergedListing.type && listing.type ) {
            mergedListing.type = listing.type
        }

        if ( !mergedListing.release_date && listing.release_date ) {
            mergedListing.release_date = listing.release_date
        }

        if ( !mergedListing.first_air_date && listing.first_air_date ) {
            mergedListing.first_air_date = listing.first_air_date
        }

        if ( !mergedListing.description && listing.description ) {
            mergedListing.description = listing.description
        }

        if ( !mergedListing.overview && listing.overview ) {
            mergedListing.overview = listing.overview
        }

        if ( !mergedListing.backdrop_path && listing.backdrop_path ) {
            mergedListing.backdrop_path = listing.backdrop_path
        }

        if ( !mergedListing.poster_path && listing.poster_path ) {
            mergedListing.poster_path = listing.poster_path
        }

        if ( !mergedListing.watchLinks && listing.watchLinks ) {
            mergedListing.watchLinks = listing.watchLinks
        }

        mergedListing.tags = Array.from( new Set( [
            ...( mergedListing.tags || [] ),
            ...( listing.tags || [] ),
        ] ) )
    }

    return mergedListing
}

function groupHomepageListings (
    listings: Listing[],
    getKey: ( listing: Listing ) => string,
    snapshotTitleById: Map<number, string>,
) {
    const groupedListings = new Map<string, Listing[]>()

    for ( const listing of listings ) {
        const key = getKey( listing )
        const existingGroup = groupedListings.get( key ) || []

        groupedListings.set( key, [
            ...existingGroup,
            listing,
        ] )
    }

    return Array.from(
        groupedListings.values(),
        ( group ) => mergeHomepageListingGroup( group, snapshotTitleById ),
    )
}

function dedupeHomepageListings (
    listings: Listing[],
    snapshotTitleById: Map<number, string>,
) {
    const groupedById = groupHomepageListings(
        listings,
        ( listing ) => {
            if ( typeof listing.id === 'number' ) {
                return `id:${ listing.id }`
            }

            return getCanonicalTimelineListingKey( listing, {
                collapseUndatedTitles: true,
            } )
        },
        snapshotTitleById,
    )

    const groupedByCanonicalIdentity = groupHomepageListings(
        groupedById,
        ( listing ) => getCanonicalTimelineListingKey( listing, {
            collapseUndatedTitles: true,
        } ),
        snapshotTitleById,
    )

    return groupHomepageListings(
        groupedByCanonicalIdentity,
        ( listing ) => {
            const normalizedTitle = getNormalizedHomepageTitle( listing )

            if ( homepageSeriesRollupTitles.has( normalizedTitle ) ) {
                return `series:${ normalizedTitle }`
            }

            return `listing:${ listing.id || normalizedTitle }`
        },
        snapshotTitleById,
    )
}

export function resolveHomepageListings (
    listings: Listing[],
    {
        now = new Date(),
        snapshotTitleById = new Map<number, string>(),
    }: {
        now?: Date
        snapshotTitleById?: Map<number, string>
    } = {},
) {
    const filteredListings = new FilteredListings( {
        listings,
        listingsSort: 'default',
    } ).list.map( ( listing ) => listing.sourceListing )

    const keptListings = filteredListings.filter( ( listing ) => {
        return shouldKeepHomepageListing( listing, snapshotTitleById, now )
    } )

    return dedupeHomepageListings( keptListings, snapshotTitleById )
}

export async function getHomepageListings () {
    const [
        allListings,
        snapshotTitleById,
    ] = await Promise.all( [
        getAllListings(),
        getSnapshotTitleById(),
    ] )

    return resolveHomepageListings( allListings, {
        snapshotTitleById,
    } )
}
