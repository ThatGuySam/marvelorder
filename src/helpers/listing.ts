
// @ts-ignore
import { Listing } from './types.ts'

export function makeListingEndpoint ( listing : Listing ) {
    return `/en/${ listing.slug }-${ listing.id }`
}

export const listingMergeConfig = { 
    mergeArrays: ( values : Array<any> ) => {
        // Use Set to merge arrays 
        // so that duplicates are removed
        return Array.from( new Set( values.flat() ) )
    } 
}