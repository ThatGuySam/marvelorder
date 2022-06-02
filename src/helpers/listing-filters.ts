// @ts-ignore
import { Listing } from './types.ts'
// @ts-ignore
import { ensureMappedListings } from './node/listing.ts'

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

	const docMatchingTerms = [
		'making of',
		'assembled',
		'marvel studios:'
	]

	// Check if our listing title contains any of the terms
	for ( let term of docMatchingTerms ) {
		if ( listing.title.toLowerCase().includes( term ) ) {
			return true
		}
	}

	return false
}

export function isShow ( listing ) {
	return listing.type === 'tv'
}

export function hasFanartLogo ( listing ) {
    return listing?.logo_on_black && listing.logo_on_black.includes( '/fanart/' )
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
        },
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
    } = {} ) {

        // Throw for invalid listings
        if ( !Array.isArray( listings ) ) throw new Error( 'Listings must be an array' )

        this.initialListings = ensureMappedListings( listings )

        this.activeFilters = new Map([
            ...defaultFilters,
            ...initialFilters,
        ])
    }

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