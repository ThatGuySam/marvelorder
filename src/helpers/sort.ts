
// @ts-ignore
import { Listing } from './types.ts'

function getTitleDate ( listing:Listing ) {
    if ( listing?.release_date ) {
        return new Date( listing.release_date )
    } else if ( listing?.first_air_date ) {
        return new Date( listing.first_air_date )
    }

    // If no release date or first air date
    // then push the title towards the future
    return Infinity
}

export function byListingDate ( a:Listing, b:Listing ) {
    const aDate = getTitleDate(a)
    const bDate = getTitleDate(b)

    if ( aDate > bDate ) {
        return -1
    } else if ( aDate < bDate ) {
        return 1
    }
}