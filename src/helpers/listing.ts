
// @ts-ignore
import { Listing } from './types.ts'

export function makeListingEndpoint ( listing : Listing ) {
    // Throw if id is not number
    if ( typeof listing.id !== 'number' ) {
        throw new Error( `Listing id must be a number and not empty. Got ${listing.id}` )
    }

    return `/en/${ listing.slug }-${ listing.id }`
}


export function convertNullValuesForAstro ( listings: Listing[] ) {
    return listings.map( listing => {

        const mappedEntries = Object.entries( listing ).map( ( [ key, value ] ) => {
            if ( value === null ) {
                return [ key, '' ]
            }
            return [ key, value ]
        })

        // Stringify null values
        return Object.fromEntries( mappedEntries )
    })
}


export const listingMergeConfig = {
    mergeArrays: ( values : Array<any> ) => {
        // Use Set to merge arrays
        // so that duplicates are removed
        return Array.from( new Set( values.flat() ) )
    }
}

export function makeTmdbImageUrl ( tmdbImagePath:string = '' , params = {} ) {

    if ( !tmdbImagePath ) throw new Error( 'tmdbImagePath must be a string' )

    const id = tmdbImagePath
        ?.split('/')
        ?.pop()
        ?.split('.')
        ?.shift()

    const imageFunctionPath = `/.netlify/functions/tmdb-image/${ id }.webp?&transparent=0`

    const sizeUrl = new URL( imageFunctionPath, 'https://marvelorder.com' )


    for ( const [ key, value ] of Object.entries( params ) ) {
        sizeUrl.searchParams.set( key, String( value ) )
    }

    return `${ sizeUrl.pathname }${ sizeUrl.search }`
}
