import { expect, test } from 'vitest'

import {
    getDateString,
    getIsoDate,
    getSeasonReleaseDate,
} from '~/src/helpers/listing.ts'

test( 'Can normalize Date instances from listing frontmatter', () => {
    const listing = {
        release_date: new Date( '2004-11-30T00:00:00.000Z' ),
    } as any

    expect( getDateString( listing ) ).toBe( '2004-11-30' )
    expect( getIsoDate( listing ) ).toBe( '2004-11-30' )
} )

test( 'Can detect seasonal release dates from strings', () => {
    const listing = {
        release_date: 'Summer 2026',
    } as any

    expect( getSeasonReleaseDate( listing ) ).toEqual( {
        name: 'summer',
        month: '08',
    } )
    expect( getIsoDate( listing ) ).toBe( '2026-08-01' )
} )
