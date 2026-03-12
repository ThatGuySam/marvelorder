import type { Listing } from '~/src/helpers/types.ts'

import {
    getDateString,
    hasLogo,
} from '~/src/helpers/listing.ts'
import { makeSlug } from '~/src/helpers/node/listing.ts'

export type ExpectedTimelineMediaType = 'movie' | 'tv' | 'either'

const preciseDatePattern = /^\d{4}-\d{2}-\d{2}$/
const yearMonthPattern = /^\d{4}-\d{2}$/
const yearOnlyPattern = /^\d{4}$/
const seasonPattern = /^(winter|spring|summer|fall)\s+(\d{4})$/i

const seasonMonths = new Map( [
    [ 'winter', '11' ],
    [ 'spring', '04' ],
    [ 'summer', '08' ],
    [ 'fall', '09' ],
] )

const blockedPrimaryTitlePrefixes = new Set( [
    'assembled',
    'the-making-of',
    'making-of',
    'marvel-studios-assembled',
    'question-everything',
    'a-fans-guide-to',
    'marvel-101',
    'marvel-studios-legends',
    'behind-the-scenes',
    'disney-gallery',
] )

function stripMarvelPrefixForMatching ( slug: string ) {
    let workingSlug = slug

    workingSlug = workingSlug.replace( /^a-marvel-studios-special-presentation-/, '' )
    workingSlug = workingSlug.replace( /^marvel-studios-special-presentation-/, '' )
    workingSlug = workingSlug.replace( /^marvel-one-shot-/, '' )
    workingSlug = workingSlug.replace( /^marvel-studios-/, '' )
    workingSlug = workingSlug.replace( /^marvels-/, '' )

    return workingSlug
}

function dedupeTags ( tags: string[] = [] ) {
    return Array.from( new Set( tags ) )
}

function getPrimaryMatchBlockReason ( listing: Pick<Listing, 'title' | 'tags' | 'description' | 'overview'> ) {
    if ( typeof listing?.title !== 'string' || listing.title.trim().length === 0 ) {
        return 'missing-title'
    }

    const normalizedTitle = normalizeTitleForTimelineMatch( listing.title )

    for ( const blockedPrefix of blockedPrimaryTitlePrefixes ) {
        if ( normalizedTitle.startsWith( blockedPrefix ) ) {
            return `blocked-title:${ blockedPrefix }`
        }
    }

    if ( Array.isArray( listing.tags ) && listing.tags.includes( 'doc' ) ) {
        return 'doc-tag'
    }

    return ''
}

function getListingCompletenessScore ( listing: Listing ) {
    let score = 0

    if ( hasLogo( listing ) ) {
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

    if ( typeof listing.first_air_date === 'string' ) {
        score += 10
    }

    if ( typeof listing.release_date === 'string' ) {
        score += 8
    }

    if ( listing.watchLinks ) {
        score += 3
    }

    if ( Array.isArray( listing.origin_country ) && listing.origin_country.length > 0 ) {
        score += 2
    }

    if ( typeof listing.backdrop_path === 'string' && listing.backdrop_path.length > 0 ) {
        score += 2
    }

    if ( typeof listing.poster_path === 'string' && listing.poster_path.length > 0 ) {
        score += 2
    }

    if ( typeof listing.description === 'string' && listing.description.length > 0 ) {
        score += 1
    }

    if ( typeof listing.overview === 'string' && listing.overview.length > 0 ) {
        score += 1
    }

    if ( typeof listing.vote_average === 'number' ) {
        score += Math.max( 0, Math.min( listing.vote_average, 10 ) )
    }

    return score
}

function getMediaTypeFlags ( listing: Listing ) {
    const tags = new Set( listing.tags || [] )

    const isTv = listing.type === 'tv' || tags.has( 'tv' ) || typeof listing.first_air_date === 'string'
    const isMovie = tags.has( 'movie' ) || typeof listing.release_date === 'string'

    return {
        isTv,
        isMovie,
    }
}

function getMediaCompatibilityScore ( listing: Listing, expectedMediaType: ExpectedTimelineMediaType ) {
    if ( expectedMediaType === 'either' ) {
        return 0
    }

    const {
        isMovie,
        isTv,
    } = getMediaTypeFlags( listing )

    if ( expectedMediaType === 'tv' ) {
        if ( isTv ) {
            return 30
        }

        if ( isMovie ) {
            return -15
        }
    }

    if ( expectedMediaType === 'movie' ) {
        if ( isMovie && !isTv ) {
            return 30
        }

        if ( isTv ) {
            return -15
        }
    }

    return 0
}

function getTitleMatchScore ( listingTitle: string, sourceTitle: string ) {
    const listingSlug = normalizeTitleForTimelineMatch( listingTitle )
    const sourceSlug = normalizeTitleForTimelineMatch( sourceTitle )

    if ( listingSlug.length === 0 || sourceSlug.length === 0 ) {
        return 0
    }

    if ( listingSlug === sourceSlug ) {
        return 100
    }

    if ( listingSlug.startsWith( sourceSlug ) || sourceSlug.startsWith( listingSlug ) ) {
        return 75
    }

    if ( listingSlug.includes( sourceSlug ) || sourceSlug.includes( listingSlug ) ) {
        return 50
    }

    return 0
}

function scoreTitleOnlyTimelineListingMatch ( listing: Listing, {
    title,
    expectedMediaType = 'either',
}: {
    title: string
    expectedMediaType?: ExpectedTimelineMediaType
} ) {
    if ( !isPrimaryTimelineCandidate( listing ) ) {
        return Number.NEGATIVE_INFINITY
    }

    const titleMatchScore = getTitleMatchScore( listing.title, title )

    // Keep title-only fallback narrow. It should only kick in for exact canonical title collisions.
    if ( titleMatchScore < 100 ) {
        return Number.NEGATIVE_INFINITY
    }

    const mediaScore = getMediaCompatibilityScore( listing, expectedMediaType )

    if ( mediaScore < 0 ) {
        return Number.NEGATIVE_INFINITY
    }

    return titleMatchScore + mediaScore + ( getListingCompletenessScore( listing ) / 100 )
}

export function normalizeTitleForTimelineMatch ( title: string ) {
    const slug = makeSlug(
        title
            .replaceAll( '™', '' )
            .replaceAll( '’', '\'' )
            .replaceAll( '&', ' and ' ),
    )

    return stripMarvelPrefixForMatching( slug )
}

export function getPreciseDateMatchValue ( date: string ) {
    const trimmedDate = date.trim()

    if ( preciseDatePattern.test( trimmedDate ) ) {
        return trimmedDate
    }

    return ''
}

export function getTimelineMonthMatchValue ( date: string ) {
    const trimmedDate = date.trim()

    if ( preciseDatePattern.test( trimmedDate ) ) {
        return trimmedDate.slice( 0, 7 )
    }

    if ( yearMonthPattern.test( trimmedDate ) ) {
        return trimmedDate
    }

    if ( yearOnlyPattern.test( trimmedDate ) ) {
        return ''
    }

    const seasonMatch = trimmedDate.match( seasonPattern )

    if ( seasonMatch ) {
        const [
            ,
            seasonName,
            year,
        ] = seasonMatch
        const month = seasonMonths.get( seasonName.toLowerCase() )

        return month ? `${ year }-${ month }` : ''
    }

    return ''
}

export function datesMatchByPrecision ( sourceDate: string, listingDate: string, dayTolerance = 0 ) {
    const preciseSourceDate = getPreciseDateMatchValue( sourceDate )
    const preciseListingDate = getPreciseDateMatchValue( listingDate )

    if ( preciseSourceDate.length > 0 && preciseListingDate.length > 0 ) {
        if ( preciseSourceDate === preciseListingDate ) {
            return true
        }

        if ( dayTolerance > 0 ) {
            const sourceTime = Date.parse( preciseSourceDate )
            const listingTime = Date.parse( preciseListingDate )
            const dayDifference = Math.abs( sourceTime - listingTime ) / ( 1000 * 60 * 60 * 24 )

            if ( dayDifference <= dayTolerance ) {
                return true
            }
        }

        return preciseSourceDate === preciseListingDate
    }

    const sourceMonthDate = getTimelineMonthMatchValue( sourceDate )
    const listingMonthDate = getTimelineMonthMatchValue( listingDate )

    return sourceMonthDate.length > 0 && sourceMonthDate === listingMonthDate
}

export function isPrimaryTimelineCandidate ( listing: Pick<Listing, 'title' | 'tags' | 'description' | 'overview'> ) {
    return getPrimaryMatchBlockReason( listing ).length === 0
}

export function getExpectedMediaTypeFromOrderedEntry ( orderedEntry: {
    timelineType?: string
    seasons?: Record<string, unknown>
} ) {
    if ( orderedEntry?.seasons && Object.keys( orderedEntry.seasons ).length > 0 ) {
        return 'tv'
    }

    if ( [ 'abc', 'disney-plus-netflix', 'freeform', 'hulu', 'web-series' ].includes( orderedEntry?.timelineType || '' ) ) {
        return 'tv'
    }

    if ( [ 'movie', 'sony' ].includes( orderedEntry?.timelineType || '' ) ) {
        return 'movie'
    }

    return 'either'
}

export function getExpectedMediaTypeFromInUniverseEntry ( inUniverseEntry: { type?: string } ) {
    if ( inUniverseEntry?.type === 'series' ) {
        return 'tv'
    }

    if ( inUniverseEntry?.type === 'movie' || inUniverseEntry?.type === 'short-form' ) {
        return 'movie'
    }

    return 'either'
}

export function scoreTimelineListingMatch ( listing: Listing, {
    title,
    date,
    expectedMediaType = 'either',
    dayTolerance = 0,
}: {
    title: string
    date: string
    expectedMediaType?: ExpectedTimelineMediaType
    dayTolerance?: number
} ) {
    const listingDate = getDateString( listing )

    if ( listingDate.length === 0 ) {
        return Number.NEGATIVE_INFINITY
    }

    if ( !datesMatchByPrecision( date, listingDate, dayTolerance ) ) {
        return Number.NEGATIVE_INFINITY
    }

    if ( !isPrimaryTimelineCandidate( listing ) ) {
        return Number.NEGATIVE_INFINITY
    }

    const titleMatchScore = getTitleMatchScore( listing.title, title )

    if ( titleMatchScore === 0 ) {
        return Number.NEGATIVE_INFINITY
    }

    const mediaScore = getMediaCompatibilityScore( listing, expectedMediaType )
    const completenessScore = getListingCompletenessScore( listing ) / 100

    return titleMatchScore + mediaScore + completenessScore
}

export function matchesTimelineListing ( listing: Listing, options: {
    title: string
    date: string
    expectedMediaType?: ExpectedTimelineMediaType
    dayTolerance?: number
} ) {
    return Number.isFinite( scoreTimelineListingMatch( listing, options ) )
}

export function findBestTimelineListingMatch ( listings: Listing[], options: {
    title: string
    date: string
    expectedMediaType?: ExpectedTimelineMediaType
    dayTolerance?: number
    allowTitleOnlyFallback?: boolean
} ) {
    let bestListing: Listing | null = null
    let bestScore = Number.NEGATIVE_INFINITY

    for ( const listing of listings ) {
        const score = scoreTimelineListingMatch( listing, options )

        if ( score <= bestScore ) {
            continue
        }

        bestScore = score
        bestListing = listing
    }

    if ( Number.isFinite( bestScore ) ) {
        return bestListing
    }

    if ( !options.allowTitleOnlyFallback ) {
        return null
    }

    let fallbackListing: Listing | null = null
    let fallbackScore = Number.NEGATIVE_INFINITY

    for ( const listing of listings ) {
        const score = scoreTitleOnlyTimelineListingMatch( listing, {
            title: options.title,
            expectedMediaType: options.expectedMediaType,
        } )

        if ( score <= fallbackScore ) {
            continue
        }

        fallbackScore = score
        fallbackListing = listing
    }

    return Number.isFinite( fallbackScore ) ? fallbackListing : null
}

export function getCanonicalTimelineListingKey ( listing: Listing, {
    collapseUndatedTitles = false,
}: {
    collapseUndatedTitles?: boolean
} = {} ) {
    const titleKey = normalizeTitleForTimelineMatch( listing.title || '' )
    const dateKey = getPreciseDateMatchValue( getDateString( listing ) ) || getTimelineMonthMatchValue( getDateString( listing ) )

    if ( titleKey.length > 0 && typeof listing.mcuTimelineOrder === 'number' ) {
        return `${ titleKey }|timeline:${ listing.mcuTimelineOrder }`
    }

    if ( titleKey.length > 0 && dateKey.length > 0 ) {
        return `${ titleKey }|${ dateKey }`
    }

    if ( collapseUndatedTitles && titleKey.length > 0 ) {
        return `${ titleKey }|undated`
    }

    return `listing:${ listing.id || listing.slug || titleKey }`
}

export function mergeCanonicalListingGroup ( listings: Listing[] ) {
    if ( listings.length === 1 ) {
        return listings[ 0 ]
    }

    const sortedListings = [ ...listings ].sort( ( listingA, listingB ) => {
        return getListingCompletenessScore( listingB ) - getListingCompletenessScore( listingA )
    } )

    const [
        primaryListing,
        ...otherListings
    ] = sortedListings

    const mergedListing: Listing = {
        ...primaryListing,
        tags: dedupeTags( primaryListing.tags ),
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

        mergedListing.tags = dedupeTags( [
            ...( mergedListing.tags || [] ),
            ...( listing.tags || [] ),
        ] )
    }

    return mergedListing
}

export function canonicalizeTimelineListings ( listings: Listing[], options: {
    collapseUndatedTitles?: boolean
} = {} ) {
    const groupedListings = new Map<string, Listing[]>()

    for ( const listing of listings ) {
        const key = getCanonicalTimelineListingKey( listing, options )
        const existingGroup = groupedListings.get( key ) || []

        groupedListings.set( key, [
            ...existingGroup,
            listing,
        ] )
    }

    return Array.from( groupedListings.values(), mergeCanonicalListingGroup )
}
