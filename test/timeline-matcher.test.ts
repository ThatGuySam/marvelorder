import { expect, test } from 'vitest'

import { getYearAndMonth } from '~/src/helpers/node/listing.ts'
import {
    canonicalizeTimelineListings,
    datesMatchByPrecision,
    getCanonicalTimelineListingKey,
} from '~/src/helpers/node/timeline-matcher.ts'
import type { Listing } from '~/src/helpers/types.ts'
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

test( 'Canonical TMDB IDs remain scoped to their media type', () => {
    const sharedFields = {
        id: 42,
        original_language: 'en',
        vote_average: 0,
    }
    const listings: Listing[] = [
        {
            ...sharedFields,
            title: 'Example Movie',
            release_date: '2027-05-01',
            media_type: 'movie',
            tags: [ 'movie' ],
        },
        {
            ...sharedFields,
            title: 'Example Series',
            first_air_date: '2027-06-01',
            media_type: 'tv',
            type: 'tv',
            tags: [ 'tv' ],
        },
    ]

    expect( canonicalizeTimelineListings( listings ) ).toHaveLength( 2 )
} )

test( 'Release listings are re-sorted after selecting the latest observation', () => {
    const listings: Listing[] = [
        {
            id: 1003596,
            title: 'Avengers 5',
            original_language: 'en',
            release_date: '2026-04-29',
            tags: [ 'movie' ],
        },
        {
            id: 1,
            title: 'Middle Release',
            original_language: 'en',
            release_date: '2026-07-01',
            tags: [ 'movie' ],
        },
        {
            id: 1003596,
            title: 'Avengers: Doomsday',
            original_language: 'en',
            release_date: '2026-12-18',
            tags: [ 'movie' ],
        },
    ]

    const canonicalListings = canonicalizeTimelineListings( listings, {
        sortByReleaseDate: true,
    } )

    expect( canonicalListings.map( listing => listing.title ) ).toEqual( [
        'Middle Release',
        'Avengers: Doomsday',
    ] )
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
    expect( listings.filter( listing => listing.title === 'Spider-Man: Brand New Day' ) ).toHaveLength( 1 )
    expect( listings.filter( listing => listing.title === 'Spider-Man 4' ) ).toHaveLength( 0 )
    expect( listings.filter( listing => listing.title === 'Avengers: Doomsday' ) ).toHaveLength( 1 )
    expect( listings.filter( listing => listing.title === 'Avengers 5' ) ).toHaveLength( 0 )
} )
