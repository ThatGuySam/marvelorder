// @ts-expect-error
import type { Listing } from './types.ts'

export function hasLogo ( listing: Listing ) {
    return listing?.logo_on_black
}

export function getDateString ( listing: Listing ) {
    return listing.release_date || listing.first_air_date
}

export function hasDate ( listing: Listing ) {
    return !!getDateString( listing )
}

const seasonMonths: Array<Array<string>> = [
    [ 'winter', '11' ],
    [ 'spring', '04' ],
    [ 'summer', '08' ],
    [ 'fall', '09' ],
]
export function getSeasonReleaseDate ( listing: Listing ) {
    if ( !hasDate( listing ) ) {
        return null
    }

    const dateString = getDateString( listing )

    for ( const [ seasonName, month ] of seasonMonths ) {
        if ( dateString?.toLowerCase().includes( seasonName ) ) {
            // const month:string = seasonMonths[ seasonName ]

            return {
                name: seasonName,
                month,
            }
        }
    }

    return null
}

export function getIsoDate ( listing: Listing ) {
    const dateString = getDateString( listing )
    const season = getSeasonReleaseDate( listing )

    if ( !!season && !!dateString ) {
        // return DateTime.fromISO( `2023-07-01` )

        // console.log( 'dateString', dateString )

        const [ , year ] = dateString?.split( ' ' )

        const isoDate = `${ year }-${ season.month }-01`

        // console.log( 'isoDate', isoDate )

        // Throw error if date is invalid
        if ( typeof isoDate !== 'string' ) {
            throw new TypeError( 'Invalid date' )
        }

        return isoDate
    }

    return dateString
}

export function makeListingEndpoint ( listing: Listing ) {
    // Throw if id is not number
    if ( typeof listing.id !== 'number' ) {
        throw new TypeError( `Listing id must be a number and not empty. Got ${ listing.id }` )
    }

    return `/en/${ listing.slug }-${ listing.id }`
}

export function convertNullValuesForAstro ( listings: Listing[] ) {
    return listings.map( ( listing ) => {
        const mappedEntries = Object.entries( listing ).map( ( [ key, value ] ) => {
            if ( value === null ) {
                return [ key, '' ]
            }
            return [ key, value ]
        } )

        // Stringify null values
        return Object.fromEntries( mappedEntries )
    } )
}

export const listingMergeConfig = {
    mergeArrays: ( values: Array<any> ) => {
        // Use Set to merge arrays
        // so that duplicates are removed
        return Array.from( new Set( values.flat() ) )
    },
}

export function makeTmdbImageUrl ( tmdbImagePath = '', params = {} ) {
    if ( !tmdbImagePath ) { throw new Error( 'tmdbImagePath must be a string' ) }

    const id = tmdbImagePath
        ?.split( '/' )
        ?.pop()
        ?.split( '.' )
        ?.shift()

    const imageFunctionPath = `/.netlify/functions/tmdb-image/${ id }.webp?&transparent=0`

    const sizeUrl = new URL( imageFunctionPath, 'https://marvelorder.com' )

    for ( const [ key, value ] of Object.entries( params ) ) {
        sizeUrl.searchParams.set( key, String( value ) )
    }

    return `${ sizeUrl.pathname }${ sizeUrl.search }`
}
