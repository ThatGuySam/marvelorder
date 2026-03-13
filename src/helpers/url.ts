import type { Listing } from './types'
import { TMDB_IMAGE_PATH } from '../config.ts'

type TmdbFunctionImagePath = `${ typeof TMDB_IMAGE_PATH }/${ string }.webp`

const trim = ( value: string, separator: string ) => value.split( separator ).filter( Boolean ).join( separator )

export function makeFunctionUrlFromTmdb ( tmdbImagePath: string ): TmdbFunctionImagePath {
    const [ tmdbImageId ] = trim( tmdbImagePath, '/' ).split( '.' )

    return `${ TMDB_IMAGE_PATH }/${ tmdbImageId }.webp`
}

export function getListingLogoUrl ( listing: Pick<Listing, 'logo_on_black'> ) {
    const {
        logo_on_black = null,
    } = listing

    if ( !logo_on_black ) {
        return null
    }

    return logo_on_black
}
