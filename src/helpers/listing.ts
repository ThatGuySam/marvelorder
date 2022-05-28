
// @ts-ignore
import { Listing } from './types.ts'

export function makeListingEndpoint ( listing : Listing ) {
    return `/en/${ listing.slug }-${ listing.id }`
}