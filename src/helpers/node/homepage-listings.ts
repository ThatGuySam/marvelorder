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
    getHomepageSeasonObservations,
    getHomepageSeasonObservationsByTitle,
    type HomepageSeasonObservation,
} from '~/src/helpers/node/homepage-season-labels.ts'
import {
    getCanonicalTimelineListingKey,
    normalizeTitleForTimelineMatch,
} from '~/src/helpers/node/timeline-matcher.ts'
import type { Listing } from '~/src/helpers/types.ts'

import { getAllListings } from './listing-files.ts'

const placeholderSequelPattern = /^(avengers|black panther|doctor strange|spider-man|thor)\s+[ivx0-9]+$/i
const homepageDuplicateObservationSimilarity = 0.95
const homepageLogoCarryoverSimilarity = 0.55
const homepageNearbyVariantSimilarity = 0.2
const homepageNearbyVariantMaxDayDistance = 7

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

function getHomepageCompanyTags ( listing: Pick<Listing, 'tags'> ) {
    if ( !Array.isArray( listing.tags ) ) {
        return []
    }

    return listing.tags
        .filter( ( tag ) => tag.startsWith( 'company-' ) )
        .sort()
}

function getHomepageCompanyKey ( listing: Pick<Listing, 'tags'> ) {
    return getHomepageCompanyTags( listing ).join( ',' )
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

function getHomepageSignalText (
    listing: Pick<Listing, 'description' | 'overview'>,
) {
    return String( listing.description || listing.overview || '' )
        .toLowerCase()
        .replace( /[^a-z0-9\s]/g, ' ' )
        .replace( /\s+/g, ' ' )
        .trim()
}

function getHomepageSignalTokens ( value: string ) {
    return Array.from(
        new Set(
            value
                .split( ' ' )
                .map( ( token ) => token.trim() )
                .filter( ( token ) => token.length > 2 ),
        ),
    )
}

function getHomepageSignalSimilarity ( valueA: string, valueB: string ) {
    const tokenSetA = new Set( getHomepageSignalTokens( valueA ) )
    const tokenSetB = new Set( getHomepageSignalTokens( valueB ) )
    const union = new Set( [
        ...tokenSetA,
        ...tokenSetB,
    ] )

    if ( union.size === 0 ) {
        return 0
    }

    let intersectionCount = 0

    for ( const token of tokenSetA ) {
        if ( tokenSetB.has( token ) ) {
            intersectionCount += 1
        }
    }

    return intersectionCount / union.size
}

function getHomepageTitleDiceCoefficient (
    listingA: Pick<Listing, 'title'>,
    listingB: Pick<Listing, 'title'>,
) {
    const normalizedTitleA = getNormalizedHomepageTitle( listingA )
    const normalizedTitleB = getNormalizedHomepageTitle( listingB )

    if ( normalizedTitleA.length < 2 || normalizedTitleB.length < 2 ) {
        return 0
    }

    const bigramCounts = new Map<string, number>()

    for ( let index = 0; index < normalizedTitleA.length - 1; index++ ) {
        const bigram = normalizedTitleA.slice( index, index + 2 )

        bigramCounts.set( bigram, ( bigramCounts.get( bigram ) || 0 ) + 1 )
    }

    let intersectionCount = 0

    for ( let index = 0; index < normalizedTitleB.length - 1; index++ ) {
        const bigram = normalizedTitleB.slice( index, index + 2 )
        const count = bigramCounts.get( bigram ) || 0

        if ( count === 0 ) {
            continue
        }

        intersectionCount += 1
        bigramCounts.set( bigram, count - 1 )
    }

    return ( 2 * intersectionCount ) / ( ( normalizedTitleA.length - 1 ) + ( normalizedTitleB.length - 1 ) )
}

function getHomepageDateTime ( listing: Pick<Listing, 'release_date' | 'first_air_date'> ) {
    const date = getHomepageDateString( listing )
    const releaseTime = Date.parse( date )

    return Number.isFinite( releaseTime ) ? releaseTime : Number.NaN
}

function hasHomepageGenre (
    listing: Pick<Listing, 'genre_ids'>,
    genreId: number,
) {
    return Array.isArray( listing.genre_ids ) && listing.genre_ids.includes( genreId )
}

function getHomepageMediaKind ( listing: Pick<Listing, 'first_air_date' | 'release_date' | 'tags' | 'type'> ) {
    if ( listing.type === 'tv' || ( Array.isArray( listing.tags ) && listing.tags.includes( 'tv' ) ) || typeof listing.first_air_date === 'string' && listing.first_air_date.length > 0 ) {
        return 'tv'
    }

    if ( ( Array.isArray( listing.tags ) && listing.tags.includes( 'movie' ) ) || ( typeof listing.release_date === 'string' && listing.release_date.length > 0 ) ) {
        return 'movie'
    }

    return ''
}

function isHomepageWhatIfEpisode ( listing: Pick<Listing, 'title'> ) {
    const lowerTitle = listing.title.toLowerCase()

    return lowerTitle.startsWith( 'what if...' ) && lowerTitle !== 'what if...?'
}

function isHomepageFuturePlaceholderTitle ( listing: Pick<Listing, 'title'> ) {
    if ( listing.title.toLowerCase().startsWith( 'untitled' ) ) {
        return true
    }

    return placeholderSequelPattern.test( listing.title )
}

function isHomepageReleasedLowConfidenceJunk (
    listing: Pick<Listing, 'description' | 'id' | 'overview' | 'release_date' | 'first_air_date' | 'vote_average'>,
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
    const releaseTime = getHomepageDateTime( listing )

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

function isHomepageMotionComicObservation (
    listing: Pick<Listing, 'description' | 'overview'>,
) {
    return /\bmotion comic\b/i.test( getHomepageSignalText( listing ) )
}

function isHomepageFanEditObservation (
    listing: Pick<Listing, 'description' | 'overview'>,
) {
    return /\bfan edit\b/i.test( getHomepageSignalText( listing ) )
}

function isHomepageVariantEditionObservation (
    listing: Pick<Listing, 'description' | 'overview'>,
) {
    return /\b(extended cut|extended version|added content|presented in color|in color|black and white|special edition|alternate cut|director s cut)\b/i
        .test( getHomepageSignalText( listing ) )
}

function isHomepageRumoredDevelopmentObservation (
    listing: Pick<Listing, 'description' | 'overview'>,
) {
    return /\b(rumored title|announced as in development)\b/i.test( getHomepageSignalText( listing ) )
}

function isHomepageKidsSpinoutObservation (
    listing: Pick<Listing, 'genre_ids' | 'logo_on_black' | 'release_date' | 'tags' | 'type' | 'vote_average'>,
) {
    return getHomepageMediaKind( listing ) === 'movie'
        && hasHomepageGenre( listing, 16 )
        && hasHomepageGenre( listing, 10751 )
        && !hasHomepageLogo( listing )
        && Number( listing.vote_average || 0 ) <= 4.5
}

function isHomepageKidsTvObservation (
    listing: Pick<Listing, 'genre_ids' | 'tags' | 'type'>,
) {
    return getHomepageMediaKind( listing ) === 'tv'
        && hasHomepageGenre( listing, 10762 )
}

function isHomepageUndatedLowSignalMovie (
    listing: Pick<Listing, 'backdrop_path' | 'genre_ids' | 'release_date' | 'first_air_date' | 'tags' | 'type' | 'vote_average'>,
) {
    return getHomepageMediaKind( listing ) === 'movie'
        && isUndated( listing )
        && !listing.backdrop_path
        && !( Array.isArray( listing.genre_ids ) && listing.genre_ids.length > 0 )
        && Number( listing.vote_average || 0 ) === 0
}

function isHomepageUndatedUnverifiedMovie (
    listing: Pick<Listing, 'backdrop_path' | 'id' | 'release_date' | 'first_air_date' | 'tags' | 'type' | 'vote_average'>,
    snapshotTitleById: Map<number, string>,
) {
    return getHomepageMediaKind( listing ) === 'movie'
        && isUndated( listing )
        && !listing.backdrop_path
        && Number( listing.vote_average || 0 ) === 0
        && getSnapshotNormalizedTitle( listing, snapshotTitleById ).length === 0
}

function hasHomepageNearbyStrongerSibling (
    listing: Listing,
    allListings: Listing[],
    snapshotTitleById: Map<number, string>,
) {
    const signalText = getHomepageSignalText( listing )
    const releaseTime = getHomepageDateTime( listing )

    if ( signalText.length === 0 || !Number.isFinite( releaseTime ) ) {
        return false
    }

    const companyKey = getHomepageCompanyKey( listing )
    const mediaKind = getHomepageMediaKind( listing )
    const listingScore = scoreHomepageListingCandidate( listing, snapshotTitleById )

    for ( const siblingListing of allListings ) {
        if ( siblingListing === listing ) {
            continue
        }

        if ( getHomepageCompanyKey( siblingListing ) !== companyKey ) {
            continue
        }

        if ( getHomepageMediaKind( siblingListing ) !== mediaKind ) {
            continue
        }

        const siblingReleaseTime = getHomepageDateTime( siblingListing )

        if ( !Number.isFinite( siblingReleaseTime ) ) {
            continue
        }

        const dayDifference = Math.abs( siblingReleaseTime - releaseTime ) / ( 1000 * 60 * 60 * 24 )

        if ( dayDifference === 0 || dayDifference > homepageNearbyVariantMaxDayDistance ) {
            continue
        }

        const siblingSignalText = getHomepageSignalText( siblingListing )
        const signalSimilarity = getHomepageSignalSimilarity( signalText, siblingSignalText )

        if ( signalSimilarity >= homepageDuplicateObservationSimilarity || signalSimilarity < homepageNearbyVariantSimilarity ) {
            continue
        }

        if ( scoreHomepageListingCandidate( siblingListing, snapshotTitleById ) > listingScore + 20 ) {
            return true
        }
    }

    return false
}

function shouldKeepHomepageListing (
    listing: Listing,
    listings: Listing[],
    snapshotTitleById: Map<number, string>,
    now = new Date(),
) {
    if ( isHomepageWhatIfEpisode( listing ) ) {
        return false
    }

    if ( isGrootEpisode( listing ) ) {
        return false
    }

    if ( isHomepageMotionComicObservation( listing ) ) {
        return false
    }

    if ( isHomepageFanEditObservation( listing ) ) {
        return false
    }

    if ( isHomepageVariantEditionObservation( listing ) ) {
        return false
    }

    if ( isHomepageRumoredDevelopmentObservation( listing ) ) {
        return false
    }

    if ( isHomepageKidsSpinoutObservation( listing ) ) {
        return false
    }

    if ( isHomepageKidsTvObservation( listing ) ) {
        return false
    }

    if ( isHomepageUndatedLowSignalMovie( listing ) ) {
        return false
    }

    if ( isHomepageUndatedUnverifiedMovie( listing, snapshotTitleById ) ) {
        return false
    }

    if ( hasHomepageNearbyStrongerSibling( listing, listings, snapshotTitleById ) ) {
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

    if ( typeof listing.description === 'string' && listing.description.length > 0 ) {
        score += 18
    }

    if ( typeof listing.overview === 'string' && listing.overview.length > 0 ) {
        score += 12
    }

    if ( typeof listing.backdrop_path === 'string' && listing.backdrop_path.length > 0 ) {
        score += 8
    }

    if ( typeof listing.poster_path === 'string' && listing.poster_path.length > 0 ) {
        score += 4
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

function shouldCarryHomepageLogo (
    primaryListing: Listing,
    secondaryListing: Listing,
    snapshotTitleById: Map<number, string>,
) {
    if ( !secondaryListing.logo_on_black ) {
        return false
    }

    const titleSimilarity = getHomepageTitleDiceCoefficient( primaryListing, secondaryListing )

    if ( titleSimilarity >= homepageLogoCarryoverSimilarity ) {
        return true
    }

    const primarySnapshotTitle = getSnapshotNormalizedTitle( primaryListing, snapshotTitleById )
    const secondarySnapshotTitle = getSnapshotNormalizedTitle( secondaryListing, snapshotTitleById )
    const primaryMatchesSnapshot = primarySnapshotTitle.length > 0 && getNormalizedHomepageTitle( primaryListing ) === primarySnapshotTitle
    const secondaryMatchesSnapshot = secondarySnapshotTitle.length > 0 && getNormalizedHomepageTitle( secondaryListing ) === secondarySnapshotTitle

    return !primaryMatchesSnapshot || secondaryMatchesSnapshot
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
        if ( !mergedListing.logo_on_black && shouldCarryHomepageLogo( mergedListing, listing, snapshotTitleById ) ) {
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

function getHomepageObservationDuplicateKey ( listing: Listing ) {
    const signalText = getHomepageSignalText( listing )
    const date = getHomepageDateString( listing )

    if ( signalText.length === 0 || date.length === 0 ) {
        return ''
    }

    return [
        getHomepageMediaKind( listing ),
        getHomepageCompanyKey( listing ),
        listing.homepageSeasonKey || '',
        date,
        signalText,
    ].join( '|' )
}

function expandHomepageSeasonListings (
    listings: Listing[],
    seasonObservationsByTitle: Map<string, HomepageSeasonObservation[]>,
) {
    return listings.flatMap( ( listing ) => {
        if ( getHomepageMediaKind( listing ) !== 'tv' ) {
            return [ listing ]
        }

        const seasonObservations = getHomepageSeasonObservations( listing, seasonObservationsByTitle )

        if ( seasonObservations.length < 2 ) {
            return [ listing ]
        }

        return seasonObservations.map( ( seasonObservation ) => {
            return {
                ...listing,
                first_air_date: seasonObservation.premiereDate,
                homepageSeasonKey: seasonObservation.seasonNumber,
                homepageSeasonLabel: seasonObservation.label,
                mcuTimelineOrder: typeof seasonObservation.mcuTimelineOrder === 'number'
                    ? seasonObservation.mcuTimelineOrder
                    : listing.mcuTimelineOrder,
                release_date: undefined,
            }
        } )
    } )
}

function dedupeHomepageListings (
    listings: Listing[],
    snapshotTitleById: Map<number, string>,
    seasonObservationsByTitle: Map<string, HomepageSeasonObservation[]>,
) {
    const groupedByObservationDuplicate = groupHomepageListings(
        listings,
        ( listing ) => {
            const duplicateKey = getHomepageObservationDuplicateKey( listing )

            return duplicateKey.length > 0 ? `duplicate:${ duplicateKey }` : `listing:${ listing.id || listing.slug || getNormalizedHomepageTitle( listing ) }`
        },
        snapshotTitleById,
    )

    const groupedById = groupHomepageListings(
        groupedByObservationDuplicate,
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

    return expandHomepageSeasonListings( groupedByCanonicalIdentity, seasonObservationsByTitle )
}

export function resolveHomepageListings (
    listings: Listing[],
    {
        now = new Date(),
        snapshotTitleById = new Map<number, string>(),
        seasonObservationsByTitle = new Map<string, HomepageSeasonObservation[]>(),
    }: {
        now?: Date
        snapshotTitleById?: Map<number, string>
        seasonObservationsByTitle?: Map<string, HomepageSeasonObservation[]>
    } = {},
) {
    const filteredListings = new FilteredListings( {
        listings,
        listingsSort: 'default',
    } ).list.map( ( listing ) => listing.sourceListing )

    const observationCollapsedListings = groupHomepageListings(
        filteredListings,
        ( listing ) => {
            const duplicateKey = getHomepageObservationDuplicateKey( listing )

            return duplicateKey.length > 0 ? `duplicate:${ duplicateKey }` : `listing:${ listing.id || listing.slug || getNormalizedHomepageTitle( listing ) }`
        },
        snapshotTitleById,
    )

    const keptListings = observationCollapsedListings.filter( ( listing ) => {
        return shouldKeepHomepageListing( listing, observationCollapsedListings, snapshotTitleById, now )
    } )

    return dedupeHomepageListings( keptListings, snapshotTitleById, seasonObservationsByTitle )
}

export async function getHomepageListings () {
    const [
        allListings,
        snapshotTitleById,
        seasonObservationsByTitle,
    ] = await Promise.all( [
        getAllListings(),
        getSnapshotTitleById(),
        getHomepageSeasonObservationsByTitle(),
    ] )

    return resolveHomepageListings( allListings, {
        snapshotTitleById,
        seasonObservationsByTitle,
    } )
}
