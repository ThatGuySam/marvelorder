import { DateTime } from 'luxon'
import { deepmergeCustom } from 'deepmerge-ts'
import slugify from 'slugify'

// @ts-ignore
import * as CONFIG from '~/src/config.ts'
// @ts-ignore
import { Listing } from '~/src/helpers/types.ts'
// @ts-ignore
import { isValidHttpUrl } from '~/src/helpers/check.ts'
import {
    makeListingEndpoint,
    listingMergeConfig,
    makeTmdbImageUrl,
    getDateString,
    hasDate,
    hasLogo,
    getSeasonReleaseDate,
    getIsoDate
// @ts-ignore
} from '~/src/helpers/listing.ts'



export function makeSlug ( name:string ) {
    if ( typeof name !== 'string' ) {
        throw new Error( 'makeSlug() requires a string' )
    }

    return slugify( name.replace( '+', ' plus' ) , {
        lower: true,
        remove: /[^a-zA-Z\d\s\-]/g,
        strict: true
    })
}

export function makeMappedListings ( listings: Listing[] ) {
    const mappedList = listings.map( listing => new MappedListing( listing ) )

    return mappedList
}

export function ensureMappedListing ( listing: Listing ) {
    if ( listing instanceof MappedListing ) {
        return listing
    }

    return new MappedListing( listing )
}

export function ensureMappedListings ( listings: Listing[] ) {
    if ( listings[0] instanceof MappedListing ) {
        return listings
    }

    return makeMappedListings( listings )
}

export const listingMerger = deepmergeCustom( listingMergeConfig )

export function mergeListingData ( listingA : Object, listingB : Object ) {
    return listingMerger( listingA, listingB )
}

export function getYearAndMonth ( date: string ) {

    if ( typeof date !== 'string' ) {
        throw new Error( 'date must be a string' )
    }

    const dateTime = DateTime.fromISO( date )
    const year = dateTime.year
    const month = dateTime.month

    return `${ year }`//-${ month }`
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
        return getDateString( this.sourceListing )
    }

    get isoDate () {
        return getIsoDate( this.sourceListing )
    }

    get date () {
        return DateTime.fromISO( this.isoDate )
    }

    get hasDate () {
        return hasDate( this.sourceListing )
    }

    get hasSeasonReleaseDate () {
        return !!this.season
    }

    get hasSpecificDate () {
        if ( !this.hasDate ) {
            return false
        }

        // Has at least 2 dashes
        return this.dateString.split( '-' ).length > 2
    }

    get year () {
        return this.date.year
    }

    get season () {
        return getSeasonReleaseDate( this.sourceListing )
    }

    get dateHumanReadable () {
        // Just say Date Unknown for null dates
        if ( !this.hasDate ) {
            return 'Order TBA'
        }

        if ( typeof this.dateString === 'string' && this.dateString.trim().length === 4 ) {
            return this.date.year
        }

        if ( this.hasSeasonReleaseDate ) {
            return this.dateString
        }

        return `${ this.date.monthLong } ${ this.date.year }`
    }

    get hasLogo () {
        return hasLogo( this.sourceListing )
    }

    get endpoint () {
        return makeListingEndpoint( this.sourceListing )
    }

    get githubEditUrl () {
        return `${ CONFIG.GITHUB_EDIT_URL }src/pages${ this.endpoint }.md`
    }

    backdrop ( params = { transparent: 0 } ) {
        if ( !this.sourceListing?.backdrop_path ) {
            return null
        }

        return makeTmdbImageUrl( this.sourceListing.backdrop_path, params )
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

    get defaultWatchLinkKey () {
        if ( isValidHttpUrl( this.sourceListing?.watchLinks?.amazon ) ) {
            return 'amazon'
        }

        return ''
    }

    get defaultWatchLink () {

        if ( this.defaultWatchLinkKey.length === 0 ) {
            return null
        }

        return {
            key: this.defaultWatchLinkKey,
            href: this.sourceListing.watchLinks[this.defaultWatchLinkKey]
        }
    }



}
