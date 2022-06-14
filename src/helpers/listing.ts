
// @ts-ignore
import { Listing } from './types.ts'

export function makeListingEndpoint ( listing : Listing ) {
    return `/en/${ listing.slug }-${ listing.id }`
}

export const listingMergeConfig = { 
    mergeArrays: ( values : Array<any> ) => {
        return Array.from( new Set( values.flat() ) )
    } 
}