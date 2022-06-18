
// @ts-ignore
import { Listing } from './types.ts'


export const byDefaultListingSort = byPremiereReversed

const bigOleNumber = 9999999999999999

export const sortTypes = {
	'default': byDefaultListingSort, 
	'none': noSort,
	'timeline': byTimelineOrder,
	'premiere': byPremiere,
    'premiere-reversed': byPremiereReversed
}

export function getSortByName ( sortType:string ) {
    return sortTypes[ sortType ]
}

function hasLogo ( listing:Listing ) {
    return listing?.logo_on_black
}

function getTitleDate ( listing:Listing ) {

    const sourceListing = listing?.isMappedListing ? listing.sourceListing : listing
    const dateString = sourceListing?.release_date || sourceListing?.first_air_date


    if ( !!dateString ) {
        return new Date( dateString )
    }

    if ( hasLogo( listing ) ) {
        return bigOleNumber - 1
    }

    // If no release date or first air date
    // then push the title towards the future
    return Infinity
}

export function noSort () {
    return 0
}

export function byPremiere ( a:Listing, b:Listing ) {
    const aDate = getTitleDate(a)
    const bDate = getTitleDate(b)

    if ( aDate > bDate ) {
        return -1
    } else if ( aDate < bDate ) {
        return 1
    }
}

export function byTimelineOrder ( a:Listing, b:Listing ) {
    const aOrder = a.mcuTimelineOrder
    const bOrder = b.mcuTimelineOrder

    if ( aOrder > bOrder ) {
        return 1
    }
    
    if ( aOrder < bOrder ) {
        return -1
    }

    return 0
}

export function byPremiereReversed ( a:Listing, b:Listing ) {
    return Number( byPremiere( a, b ) ) * -1
}

