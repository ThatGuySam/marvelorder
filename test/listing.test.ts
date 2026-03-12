import { expect, test } from 'vitest'

import { ensureMappedListings } from '~/src/helpers/node/listing.ts'
import {
    getDateString as getListingDateString,
    getIsoDate as getListingIsoDate,
    getSeasonReleaseDate as getListingSeasonReleaseDate,
} from '~/src/helpers/listing.ts'

test( 'Can normalize Date instances from listing frontmatter', () => {
    const listing = {
        release_date: new Date( '2004-11-30T00:00:00.000Z' ),
    } as any

    expect( getListingDateString( listing ) ).toBe( '2004-11-30' )
    expect( getListingIsoDate( listing ) ).toBe( '2004-11-30' )
} )

test( 'Can detect seasonal release dates from strings', () => {
    const listing = {
        release_date: 'Summer 2026',
    } as any

    expect( getListingSeasonReleaseDate( listing ) ).toEqual( {
        name: 'summer',
        month: '08',
    } )
    expect( getListingIsoDate( listing ) ).toBe( '2026-08-01' )
} )

test( 'Can map listings into listing-row friendly models', () => {
    const [ listing ] = ensureMappedListings( [
        {
            id: 123,
            title: 'Example Listing',
            slug: 'example-listing',
            overview: 'Overview',
        } as any,
    ] )

    expect( listing.endpoint ).toBe( '/en/example-listing-123' )
    expect( listing.elementId ).toBe( 'example-listing-123' )
} )
