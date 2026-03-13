import { expect, test } from 'vitest'

import { getListingLogoUrl, makeFunctionUrlFromTmdb } from '~/src/helpers/url'
import {
    collapseImagePathsToPlaceholders,
    expandImagePathPlaceholders,
} from '~/src/helpers/image-paths'
import {
    FANART_IMAGE_PATH,
    IMAGE_WORKER_ORIGIN,
    NETLIFY_FANART_IMAGE_PATH,
    NETLIFY_TMDB_IMAGE_PATH,
    TMDB_IMAGE_PATH,
} from '~/src/config'

test( 'Can convert tmdb image paths to function urls', () => {
    expect( makeFunctionUrlFromTmdb( '/kbYbZR4FgcLTfI6HT2hiEqoPvr9.jpg' ) )
        .toBe( `${ TMDB_IMAGE_PATH }/kbYbZR4FgcLTfI6HT2hiEqoPvr9.webp` )
} )

test( 'Can get a listing logo url when one exists', () => {
    expect( getListingLogoUrl( { logo_on_black: `${ FANART_IMAGE_PATH }/example.png` } ) )
        .toBe( `${ FANART_IMAGE_PATH }/example.png` )
} )

test( 'Can return null when a listing does not have a logo url', () => {
    expect( getListingLogoUrl( { logo_on_black: undefined } ) ).toBeNull()
} )

test( 'Can expand markdown image path placeholders', () => {
    expect( expandImagePathPlaceholders( {
        logo_on_black: '{tmdb-path}/example.webp',
        coverPosterUrl: '{fanart-path}/cover.png',
    } ) ).toEqual( {
        logo_on_black: `${ TMDB_IMAGE_PATH }/example.webp`,
        coverPosterUrl: `${ FANART_IMAGE_PATH }/cover.png`,
    } )
} )

test( 'Can collapse image paths back to markdown placeholders', () => {
    expect( collapseImagePathsToPlaceholders( {
        logo_on_black: `${ TMDB_IMAGE_PATH }/example.webp`,
        coverPosterUrl: `${ FANART_IMAGE_PATH }/cover.png`,
    } ) ).toEqual( {
        logo_on_black: '{tmdb-path}/example.webp',
        coverPosterUrl: '{fanart-path}/cover.png',
    } )
} )

test( 'Can also collapse netlify image paths back to markdown placeholders', () => {
    expect( collapseImagePathsToPlaceholders( {
        logo_on_black: `${ NETLIFY_TMDB_IMAGE_PATH }/example.webp`,
        coverPosterUrl: `${ NETLIFY_FANART_IMAGE_PATH }/cover.png`,
        workerLogo: `${ IMAGE_WORKER_ORIGIN }${ NETLIFY_TMDB_IMAGE_PATH }/second-example.webp`,
    } ) ).toEqual( {
        logo_on_black: '{tmdb-path}/example.webp',
        coverPosterUrl: '{fanart-path}/cover.png',
        workerLogo: '{tmdb-path}/second-example.webp',
    } )
} )
