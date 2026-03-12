import { expect, test } from 'vitest'

import { getYearAndMonth } from '~/src/helpers/node/listing.ts'
import {
    datesMatchByPrecision,
    getCanonicalTimelineListingKey,
} from '~/src/helpers/node/timeline-matcher.ts'
import {
    getPublicMcuReleaseListings,
    getPublicMcuTimelineListings,
} from '~/src/helpers/node/public-mcu-listings.ts'

function getDuplicateKeys ( keys: string[] ) {
    const counts = new Map<string, number>()

    for ( const key of keys ) {
        counts.set( key, ( counts.get( key ) || 0 ) + 1 )
    }

    return Array.from( counts.entries() )
        .filter( ( [ , count ] ) => count > 1 )
        .map( ( [ key ] ) => key )
}

test( 'Year-month matching keeps month precision', () => {
    expect( getYearAndMonth( '2015-04-10' ) ).toBe( '2015-04' )
    expect( getYearAndMonth( 'Summer 2026' ) ).toBe( '2026-08' )
    expect( getYearAndMonth( '2015' ) ).toBe( '' )
    expect( datesMatchByPrecision( '2011-07-21', '2011-07-22' ) ).toBe( false )
    expect( datesMatchByPrecision( '2011-07-21', '2011-07-22', 1 ) ).toBe( true )
} )

test( 'Public MCU timeline listings collapse duplicate observation cards', async () => {
    const listings = await getPublicMcuTimelineListings()

    const duplicateKeys = getDuplicateKeys(
        listings.map( listing => getCanonicalTimelineListingKey( listing ) ),
    )

    expect( duplicateKeys ).toEqual( [] )

    const expectedCanonicalIds = new Map( [
        [ 'Marvel\'s Daredevil', 61889 ],
        [ 'Marvel\'s Iron Fist', 62127 ],
        [ 'Marvel\'s Luke Cage', 62126 ],
        [ 'Marvel\'s The Punisher', 67178 ],
        [ 'What If...?', 91363 ],
    ] )

    for ( const [ title, expectedId ] of expectedCanonicalIds.entries() ) {
        const matchingListings = listings.filter( listing => listing.title === title )

        expect( matchingListings ).toHaveLength( 1 )
        expect( matchingListings[ 0 ].id ).toBe( expectedId )
        expect( matchingListings[ 0 ].logo_on_black ).toBeTruthy()
    }
} )

test( 'Public MCU release listings collapse current duplicate MCU cards', async () => {
    const listings = await getPublicMcuReleaseListings()

    const duplicateKeys = getDuplicateKeys(
        listings.map( listing => getCanonicalTimelineListingKey( listing, {
            collapseUndatedTitles: true,
        } ) ),
    )

    expect( duplicateKeys ).toEqual( [] )

    expect( listings.filter( listing => listing.title === 'What If...?' ) ).toHaveLength( 1 )
    expect( listings.filter( listing => listing.title === 'Black Panther 3' ) ).toHaveLength( 1 )
    expect( listings.filter( listing => listing.title === 'Thor 5' ) ).toHaveLength( 1 )
} )
