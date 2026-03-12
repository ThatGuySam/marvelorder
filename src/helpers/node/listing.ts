import { DateTime } from 'luxon'
import { deepmergeCustom } from 'deepmerge-ts'
import slugify from 'slugify'

import * as CONFIG from '~/src/config.ts'

import type { Listing, ListingFrontMatter } from '~/src/helpers/types.ts'

import { isValidHttpUrl } from '~/src/helpers/check.ts'
import {
    getDateString,
    getIsoDate,
    getSeasonReleaseDate,
    hasDate,
    hasLogo,
    listingMergeConfig,
    makeListingEndpoint,
    makeTmdbImageUrl,
} from '~/src/helpers/listing.ts'

export function makeSlug ( name: string ) {
    if ( typeof name !== 'string' ) {
        throw new TypeError( 'makeSlug() requires a string' )
    }

    return slugify( name.replace( '+', ' plus' ), {
        lower: true,
        remove: /[^a-zA-Z\d\s\-]/g,
        strict: true,
    } )
}

export function makeMappedListings ( listings: Listing[] ): MappedListing[] {
    const mappedList = listings.map( listing => ensureMappedListing( listing ) )

    return mappedList
}

export function ensureMappedListing ( listing: Listing | MappedListing ): MappedListing {
    if ( listing instanceof MappedListing ) {
        return listing
    }

    return new MappedListing( listing )
}

export function ensureMappedListings ( listings: Array<Listing | MappedListing> ): MappedListing[] {
    if ( listings.every( ( listing ): listing is MappedListing => listing instanceof MappedListing ) ) {
        return listings
    }

    return makeMappedListings( listings )
}

export const listingMerger = deepmergeCustom( listingMergeConfig )

export function mergeListingData<T extends object, U extends object> ( listingA: T, listingB: U ): T & U {
    return listingMerger( listingA, listingB ) as T & U
}

export function getYearAndMonth ( date: string ) {
    if ( typeof date !== 'string' ) {
        throw new TypeError( 'date must be a string' )
    }

    const trimmedDate = date.trim()

    if ( /^\d{4}-\d{2}-\d{2}$/.test( trimmedDate ) ) {
        return trimmedDate.slice( 0, 7 )
    }

    if ( /^\d{4}-\d{2}$/.test( trimmedDate ) ) {
        return trimmedDate
    }

    if ( /^\d{4}$/.test( trimmedDate ) ) {
        return ''
    }

    const seasonMatch = trimmedDate.match( /^(winter|spring|summer|fall)\s+(\d{4})$/i )

    if ( seasonMatch ) {
        const seasonMonths = new Map( [
            [ 'winter', '11' ],
            [ 'spring', '04' ],
            [ 'summer', '08' ],
            [ 'fall', '09' ],
        ] )
        const [
            ,
            seasonName,
            year,
        ] = seasonMatch
        const month = seasonMonths.get( seasonName.toLowerCase() )

        return month ? `${ year }-${ month }` : ''
    }

    const dateTime = DateTime.fromISO( trimmedDate )

    if ( !dateTime.isValid ) {
        return ''
    }

    return `${ dateTime.year }-${ String( dateTime.month ).padStart( 2, '0' ) }`
}

export class MappedListing {
    constructor ( listing: Listing ) {
        this.sourceListing = listing

        // Map properties from the listing
        for ( const [ key, value ] of Object.entries( listing ) ) {
            this[ key ] = value
        }
    }

    sourceListing: Listing

    isMappedListing = true as const

    get dateString (): string {
        return getDateString( this.sourceListing )
    }

    get isoDate (): string {
        return getIsoDate( this.sourceListing )
    }

    get date (): DateTime {
        return DateTime.fromISO( this.isoDate )
    }

    get hasDate (): boolean {
        return hasDate( this.sourceListing )
    }

    get hasSeasonReleaseDate (): boolean {
        return !!this.season
    }

    get hasSpecificDate (): boolean {
        if ( !this.hasDate ) {
            return false
        }

        // Has at least 2 dashes
        return this.dateString.split( '-' ).length > 2
    }

    get year (): number {
        return this.date.year
    }

    get season (): { name: string, month: string } | null {
        return getSeasonReleaseDate( this.sourceListing )
    }

    get dateHumanReadable (): string | number {
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

    get hasLogo (): boolean {
        return hasLogo( this.sourceListing )
    }

    get endpoint (): string {
        return makeListingEndpoint( this.sourceListing )
    }

    get githubEditUrl (): string {
        return `${ CONFIG.GITHUB_EDIT_URL }src/pages${ this.endpoint }.md`
    }

    backdrop ( params: Record<string, string | number> = { transparent: 0 } ): string | null {
        if ( !this.sourceListing?.backdrop_path ) {
            return null
        }

        return makeTmdbImageUrl( this.sourceListing.backdrop_path, params )
    }

    get elementId (): string {
        return [
            this.sourceListing.slug,
            this.sourceListing.id,
        ].join( '-' )
    }

    hasTag ( tagName: string ): boolean {
        // If this listting has no tags, return false
        if ( !this.sourceListing?.tags ) {
            return false
        }

        return this.sourceListing.tags.includes( tagName )
    }

    get defaultWatchLinkKey (): '' | 'amazon' {
        if ( isValidHttpUrl( this.sourceListing?.watchLinks?.amazon ) ) {
            return 'amazon'
        }

        return ''
    }

    get defaultWatchLink (): { key: '' | 'amazon', href: string | undefined } | null {
        if ( this.defaultWatchLinkKey.length === 0 ) {
            return null
        }

        return {
            key: this.defaultWatchLinkKey,
            href: this.sourceListing.watchLinks[ this.defaultWatchLinkKey ],
        }
    }
}

export interface MappedListing extends Listing {
    sourceListing: Listing
    isMappedListing: true
    dateString: string
    isoDate: string
    date: DateTime
    hasDate: boolean
    hasSeasonReleaseDate: boolean
    hasSpecificDate: boolean
    year: number
    season: { name: string, month: string } | null
    dateHumanReadable: string | number
    hasLogo: boolean
    endpoint: string
    githubEditUrl: string
    backdrop: ( params?: Record<string, string | number> ) => string | null
    elementId: string
    hasTag: ( tagName: string ) => boolean
    defaultWatchLinkKey: '' | 'amazon'
    defaultWatchLink: { key: '' | 'amazon', href: string | undefined } | null
}
