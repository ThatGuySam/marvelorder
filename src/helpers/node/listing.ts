import { DateTime } from 'luxon'

// @ts-ignore
import { Listing } from '~/src/helpers/types.ts'
// @ts-ignore
import { makeListingEndpoint } from '~/src/helpers/listing.ts'

export function makeMappedListings ( listings: Listing[] ) {
    return listings.map( listing => new MappedListing( listing ) )
}

export class MappedListing {
    constructor ( listing : Listing ) {
        this.sourceListing = listing

        // Map properties from the listing
        for ( const [ key, value ] of Object.entries( listing ) ) {
            this[key] = value
        }
    }

    sourceListing

    isMappedListing = true

    get dateString () {
        return this.sourceListing.release_date || this.sourceListing.first_air_date
    }

    get date () {
        return DateTime.fromISO( this.dateString )
    }

    get hasDate () {
        return !!this.dateString
    }

    get year () {
        return this.date.year
    }

    get dateHumanReadable () {
        // Just say Date Unknown for null dates
        if ( !this.hasDate ) {
            return 'Order TBA'
        }

        if ( typeof this.dateString === 'string' && this.dateString.trim().length === 4 ) {
            return this.date.year
        }

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

    hasTag ( tagName : string ) {
        // If this listting has no tags, return false
        if ( !this.sourceListing?.tags ) {
            return false
        }

        return this.sourceListing.tags.includes( tagName )
    }
    
}