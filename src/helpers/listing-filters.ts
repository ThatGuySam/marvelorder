// @ts-ignore
import { Listing } from './types.ts'
// @ts-ignore
import { ensureMappedListings } from './node/listing.ts'
// @ts-ignore
import { getSortByName } from '~/src/helpers/sort.ts'

export function isUpcoming ( listing ) {
	// console.log( 'now - listing.date', now - listing.date )

	const now = new Date()

	const timeDifference = Number( now ) - listing.date

	if ( typeof timeDifference !== 'number') {
		return true
	}

	return timeDifference < 0
}

export function isDoc ( listing ) {
	// Check if listing has a doc tag
	if ( listing.hasTag( 'doc' ) ) {
		return true
	}

	const docMatchingTerms = new Set([
        'making of',
		'assembled',
		'marvel studios:',
        'anniversary',
    ])

	// Check if our listing title contains any of the terms
	for ( let term of docMatchingTerms ) {
		if ( listing.title.toLowerCase().includes( term ) ) {
			return true
		}
	}

    // Prefer description
    // so that we can override it in Markdown
    const description = listing?.description || listing.overview

    // overview has word documentary
    if ( description.toLowerCase().includes( 'documentary' ) ) {
        return true
    }

    

	return false
}

export function isShow ( listing ) {
	return listing.type === 'tv'
}

export function hasAnyTags ( listing ) {
    return Array.isArray( listing.tags ) && listing.tags.length > 0
}

export function hasAnyGenres ( listing ) {
    return Array.isArray( listing.genre_ids ) && listing.genre_ids.length > 0
}

export function isMarvelKnights ( listing ) {
    if ( !hasAnyTags( listing ) ) return false

    return listing.tags.includes( 'company-11106' )
}

export function isMarvelStudios ( listing ) {
    if ( !hasAnyTags( listing ) ) return false

    return listing.tags.includes( 'company-420' )
}

const theFuture = new Date( 999999999999999 )

export function isMCU ( listing ) {
    if ( !hasAnyTags( listing ) ) return false

    if ( !isMarvelStudios( listing ) ) return false

    const listingDate = listing.date?.valueOf() || theFuture

    // console.log('listingDate', listing.title, listingDate)

    // May 5, 2008
    // April 1, 2008 - According to TMDb 
    const ironManRelease = new Date( 2008, 3, 29 )
    const isAfterIronMan = listingDate > ironManRelease

    // If it's before April 2008(Iron Man)
    // then it's not MCU
    if ( !isAfterIronMan ) return false
    
    // August 11, 2021 - According to TMDb 
    const whatIfRelease = new Date( 2021, 7, 1 )
    const isBeforeWhatIf = listingDate < whatIfRelease

    // If it's animated but before What If
    // then it's not MCU
    if ( isAnimatedGenre( listing ) && isBeforeWhatIf ) {
        // console.log('excluded animated', listing.title)
        return false
    }


    // Maybe add a filter here for Marvel Studios series before WandaVision


    return true
}

export function isAnimatedGenre ( listing ) {
    if ( !hasAnyGenres( listing ) ) return false

    return listing.genre_ids.includes( 16 )
}

export function isMarvelKnightsAnimated ( listing ) {
    return isMarvelKnights( listing ) && isAnimatedGenre( listing )
}

export function hasLogo ( listing ) {
    if ( typeof listing?.logo_on_black !== 'string' ) return false

    return listing.logo_on_black.length > 0
}

export function hasFanartLogo ( listing ) {
    return hasLogo( listing ) && listing.logo_on_black.includes( '/fanart/' )
}


export function isMcuSheetOrdered ( listing ) {
    // console.log( 'isMcuSheetOrdered', listing.title, listing?.mcuTimelineOrder )
    return typeof listing?.mcuTimelineOrder === 'number'
}


export function matchesFilters ( filters ) {
    const filterOut = false
    const keep = true

    // If filters is an array
    // then convertt it to a map
    if ( Array.isArray( filters ) ) {
        filters = new Map( filters )
    }

    // console.log( 'filters', filters )
    
    // We create a function here 
    // so that we can use it as a filter
    // ex array.filter( matchesFilters( filters ) )
	const filtersFunction = listing => {

		// Loop through filters
		// and stop of a filter doesn't match
		// our set value
		for ( const [ filterMethod, matchingDetails ] of filters.entries() ) {

            // If matchingDetails is an object
            // then we get target value from it ex: matchingDetails.targetValue
            // otherwise we just use the matchingDetails directly
            const targetValue = Object( matchingDetails ) === matchingDetails ? matchingDetails.targetValue : matchingDetails

			// Apply filter to listing
			if ( filterMethod( listing ) !== targetValue ) {
				// If the filter doesn't match
				// filter it out
				return filterOut
			}
		}

		return keep
	}

    return filtersFunction
}

// We'll use a map 
// so that we're allowed to set the function as the key
export const defaultFilters = new Map([
    [
        isDoc, 
        { 
            targetValue: false
        }
    ],
    [
        isMarvelKnightsAnimated, 
        {
            targetValue: false
        }
    ]
])

export class ListingFilters {

    constructor ( {
        initialFilters = new Map(),
    } = {}) {
        this.activeFilters = new Map([
            ...defaultFilters,
            ...initialFilters,
        ])
    }

    activeFilters : Map<Function, { targetValue : Boolean }>

    // filteredIds

    // markFiltered ( listings ) {}

    filter( listings ) {
        return listings.filter( matchesFilters( this.activeFilters )  )
    }
}

export class FilteredListings {
    constructor ( {
        listings = null,
        initialFilters = new Map(),
        listingsSort = '' as string,
    } = {} ) {

        // Throw for empty sort
        if ( listingsSort.length === 0 ) throw new Error( 'Must specify a sort' )

        // Throw for invalid listings
        if ( !Array.isArray( listings ) ) throw new Error( 'Listings must be an array' )

        this.listingsSort = getSortByName( listingsSort )

        this.initialListings = ensureMappedListings( listings ).sort( this.listingsSort )

        this.activeFilters = new Map([
            ...defaultFilters,
            ...initialFilters,
        ])
        
    }

    listingsSort : Function

    initialListings : Listing[]

    activeFilters : Map<Function, { targetValue : Boolean }>
    

    withFilters ( extraFilters ) {
        const filters = new Map([
            ...this.activeFilters,
            ...extraFilters,
        ])

        // console.log('activeFilters', this.activeFilters)
        // console.log('this.list', this.list)

        return this.list.filter( matchesFilters( filters ) )
    }

    get list () {
        return this.initialListings.filter( matchesFilters( this.activeFilters ) )
    }

    get first () {
        return this.list[0]
    }

}