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

export function matchesFilters ( filters ) {
    const filterOut = false
    const keep = true

    // If filters is an array
    // then convertt it to a map
    if ( Array.isArray( filters ) ) {
        filters = new Map( filters )
    }
    
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
            targetValue: true
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