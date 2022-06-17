
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