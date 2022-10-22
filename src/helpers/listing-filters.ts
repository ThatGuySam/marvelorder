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


const docMatchingTerms = new Set([
    'making of',
    'assembled',
    'marvel studios:',
    'anniversary',
    'behind-the-scenes',
    'behind the scenes',
])

const docMatchingDescriptionTerms = new Set([
    // 'making of',
    // 'assembled',
    // 'marvel studios:',
    // 'anniversary',
    'documentary',
    'behind-the-scenes',
    'behind the scenes',
])

export function isDoc ( listing ) {
	// Check if listing has a doc tag
	if ( listing.hasTag( 'doc' ) ) {
		return true
	}

	// Check if our listing title contains any of the terms
	for ( let term of docMatchingTerms ) {
		if ( listing.title.toLowerCase().includes( term ) ) {
			return true
		}
	}

    // Prefer description
    // so that we can override it in Markdown
    const description = listing?.description || listing.overview

    // Description has mathcing doc term
    for ( let term of docMatchingDescriptionTerms ) {
        if ( description?.toLowerCase().includes( term ) ) {
            return true
        }
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
const oneDay = 24 * 60 * 60 * 1000

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

export function isPhaseZero ( listing ) {
    const listingDate = listing.date?.valueOf() || theFuture

    // May 2, 2008 - According to Google
    // April 1, 2008 - According to TMDb
    const ironManRelease = new Date( 2008, 2, 5 )
    const isBeforeIronMan = listingDate < ironManRelease

    return isBeforeIronMan
}

// https://marvelcinematicuniverse.fandom.com/wiki/Phase_One
export function isPhaseOne ( listing ) {
    // If it's not MCU
    // then it's not Phase One
    if ( !isMCU( listing ) ) return false

    return betweenDates({
        listing,
        // First Iron Man
        // May 2, 2008 - According to Google
        // April 1, 2008 - According to TMDb
        start: new Date( 2008, 2, 5 ),

        // First Avengers movie
        // May 4, 2012 - Google
        end: new Date( 2012, 4, 5 )
    })
}


// https://marvelcinematicuniverse.fandom.com/wiki/Phase_Two
export function isPhaseTwo ( listing ) {
    // If it's not MCU
    // then it's not in a Phase
    if ( !isMCU( listing ) ) return false

    return betweenDates({
        listing,
        // Third Iron Man
        // https://marvelcinematicuniverse.fandom.com/wiki/Iron_Man_3
        // May 3, 2013
        start: new Date( 2013, 3, 5 ),

        // First Ant-Man
        // https://marvelcinematicuniverse.fandom.com/wiki/Ant-Man_(film)
        // July 17, 2015
        end: new Date( 2015, 14, 7 )
    })
}


// https://marvelcinematicuniverse.fandom.com/wiki/Phase_Three
export function isPhaseThree ( listing ) {
    // If it's not MCU
    // then it's not in a Phase
    if ( !isMCU( listing ) ) return false

    return betweenDates({
        listing,

        // Captain America: Civil War
        // https://marvelcinematicuniverse.fandom.com/wiki/Captain_America:_Civil_War
        // May 6, 2016
        start: new Date( 'May 6, 2016' ),

        // Spider-Man: Far From Home
        // https://marvelcinematicuniverse.fandom.com/wiki/Spider-Man:_Far_From_Home
        // July 2, 2019
        end: new Date( 'July 2, 2019' ),
    })
}

// https://marvelcinematicuniverse.fandom.com/wiki/Infinity_Saga
export function isInfinitySaga ( listing ) {
    // If it's not MCU
    // then it's not in a Phase
    if ( !isMCU( listing ) ) return false

    const phases = [
        isPhaseOne,
        isPhaseTwo,
        isPhaseThree,
    ]

    for ( const isInPhase of phases ) {
        if ( isInPhase( listing ) ) return true
    }

    return false
}


// https://marvelcinematicuniverse.fandom.com/wiki/Phase_Four
export function isPhaseFour ( listing ) {
    // If it's not MCU
    // then it's not in a Phase
    if ( !isMCU( listing ) ) return false

    return betweenDates({
        listing,

        // WandaVision
        // https://marvelcinematicuniverse.fandom.com/wiki/WandaVision
        start: new Date( 'January 15, 2021' ),

        // Black Panther: Wakanda Forever
        // https://marvelcinematicuniverse.fandom.com/wiki/Black_Panther:_Wakanda_Forever
        end: new Date( 'November 11, 2022' ),
    })
}

// https://marvelcinematicuniverse.fandom.com/wiki/Phase_Five
export function isPhaseFive ( listing ) {
    // If it's not MCU
    // then it's not in a Phase
    if ( !isMCU( listing ) ) return false

    return betweenDates({
        listing,

        // Ant-Man and the Wasp: Quantumania
        // https://marvelcinematicuniverse.fandom.com/wiki/Ant-Man_and_the_Wasp:_Quantumania
        start: new Date( 'February 17, 2023' ),

        // Thunderbolts
        // https://marvelcinematicuniverse.fandom.com/wiki/Thunderbolts_(film)
        end: new Date( 'July 26, 2024' ),
    })
}

// https://marvelcinematicuniverse.fandom.com/wiki/Phase_Six
export function isPhaseSix ( listing ) {
    // If it's not MCU
    // then it's not in a Phase
    if ( !isMCU( listing ) ) return false

    return betweenDates({
        listing,

        // Fantastic Four (2024)
        // https://marvelcinematicuniverse.fandom.com/wiki/Fantastic_Four_(film)
        start: new Date( 'November 8, 2024' ),

        // Avengers: Secret Wars
        // https://marvelcinematicuniverse.fandom.com/wiki/Avengers:_Secret_Wars
        end: new Date( 'November 7, 2025' ),
    })

}

// https://marvelcinematicuniverse.fandom.com/wiki/Multiverse_Saga
export function isMultiverseSaga ( listing ) {
    // If it's not MCU
    // then it's not in a Phase
    if ( !isMCU( listing ) ) return false

    const phases = [
        isPhaseFour,
        isPhaseFive,
        isPhaseSix,
    ]

    for ( const isInPhase of phases ) {
        if ( isInPhase( listing ) ) return true
    }

    return false
}



export function isAnimatedGenre ( listing ) {
    if ( !hasAnyGenres( listing ) ) return false

    return listing.genre_ids.includes( 16 )
}

export function isMarvelKnightsAnimated ( listing ) {
    return isMarvelKnights( listing ) && isAnimatedGenre( listing )
}

export function isGrootEpisode ( listing ) {
    const iAmGrootReleaseDates = [ '2022-08-10', '2022-07-18' ]

    if ( !listing.release_date || !iAmGrootReleaseDates.includes( listing.release_date ) ) return false

    // If it's title is not "I Am Groot"
    // then it's not the Groot episode
    return !listing.title.toLowerCase().includes( 'i am groot' )
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

const wongIds = new Set([
    // Doctor Strange
    284052,
    // Infinity War
    299536,
    // Endgame
    299534,
    // Shang-Chi
    566525,
    // What If?
    91363,
    // No Way Home
    634649,
    // Multiverse of Madness
    453395,
    // She-Hulk
    92783
])

export function isWongCinematicUniverse ( listing ) {

    // Check Wong IDs
    if ( wongIds.has( listing.id ) ) return true

    // Description contains the word "Wong"
    // Match whole words only
    if ( listing.overview?.toLowerCase()?.match( /\bwong\b/ ) ) return true

    return false
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

function betweenDates ( {
    listing,
    // Threshold to compensate for slightly off dates
    threshold = oneDay * 10,

    start,
    end
} ) {
    if ( !listing?.date?.valueOf() ) return false

    const listingDate = listing.date?.valueOf()

    const isBefore = listingDate < ( Number( start ) - threshold)
    if ( isBefore ) return false

    const isAfter = ( Number( end ) + threshold ) < listingDate
    if ( isAfter ) return false


    return true
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
    ],
    [
        isGrootEpisode,
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
        useDefaultFilters = true as boolean,
    } = {} ) {

        // Throw for empty sort
        if ( listingsSort.length === 0 ) throw new Error( 'Must specify a sort' )

        // Throw for invalid listings
        if ( !Array.isArray( listings ) ) throw new Error( 'Listings must be an array' )

        this.listingsSort = getSortByName( listingsSort )

        this.initialListings = ensureMappedListings( listings ).sort( this.listingsSort )

        const baseFilters = useDefaultFilters ? defaultFilters : new Map()

        this.activeFilters = new Map([
            ...baseFilters,
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
