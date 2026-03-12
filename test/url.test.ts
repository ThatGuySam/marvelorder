import { expect, test } from 'vitest'

import { getListingLogoUrl, makeFunctionUrlFromTmdb } from '~/src/helpers/url'

test( 'Can convert tmdb image paths to function urls', () => {
    expect( makeFunctionUrlFromTmdb( '/kbYbZR4FgcLTfI6HT2hiEqoPvr9.jpg' ) )
        .toBe( '/.netlify/functions/tmdb-image/kbYbZR4FgcLTfI6HT2hiEqoPvr9.webp' )
} )

test( 'Can get a listing logo url when one exists', () => {
    expect( getListingLogoUrl( { logo_on_black: '/.netlify/functions/fanart/example.png' } ) )
        .toBe( '/.netlify/functions/fanart/example.png' )
} )

test( 'Can return null when a listing does not have a logo url', () => {
    expect( getListingLogoUrl( { logo_on_black: undefined } ) ).toBeNull()
} )
