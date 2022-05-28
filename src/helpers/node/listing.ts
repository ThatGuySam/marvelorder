import { DateTime } from 'luxon'

// @ts-ignore
import { Listing } from '~/src/helpers/types.ts'
// @ts-ignore
import { makeListingEndpoint } from '~/src/helpers/listing.ts'

export class MappedListing {
    constructor ( listing : Listing ) {
        this.sourceListing = listing

        // Map properties from the listing
        for ( const [ key, value ] of Object.entries( listing ) ) {
            this[key] = value
        }
    }

    sourceListing

    get dateString () {
        return this.sourceListing.release_date || this.sourceListing.first_air_date
    }

    get date () {
        return DateTime.fromISO( this.dateString )
    }

    get year () {
        return this.date.year
    }

    get dateHumanReadable () {
        return `${ this.date.monthLong } ${ this.date.year }`
    }

    get endpoint () {
        return makeListingEndpoint( this.sourceListing )
    }

    get elementId () {
        return [
            this.sourceListing.slug,
            this.sourceListing.id,
        ].join('-')
    }
    
}