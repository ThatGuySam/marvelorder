import { expect, test } from 'vitest'

import {
    getAuthoritativeReleaseDateOverride,
    normalizeListingObservation,
} from '~/src/helpers/node/listing-source-overrides.ts'

test( 'Listing observation normalization restores blank TMDB dates when frontmatter clears them', () => {
    const normalizedListing = normalizeListingObservation(
        {
            id: 241388,
            title: 'Eyes of Wakanda',
            first_air_date: '',
        } as any,
        {
            first_air_date: '2025-08-01',
        } as any,
    )

    expect( normalizedListing.first_air_date ).toBe( '2025-08-01' )
} )

test( 'Authoritative release date overrides replace stale or missing studio dates', () => {
    const spiderManOverride = getAuthoritativeReleaseDateOverride( {
        id: 969681,
    } )
    const beyondSpiderVerse = normalizeListingObservation(
        {
            id: 911916,
            title: 'Spider-Man: Beyond the Spider-Verse',
            release_date: '',
        } as any,
        {},
    )
    const brandNewDay = normalizeListingObservation(
        {
            id: 969681,
            title: 'Spider-Man: Brand New Day',
            release_date: '2026-07-29',
        } as any,
        {},
    )

    expect( spiderManOverride?.value ).toBe( '2026-07-31' )
    expect( beyondSpiderVerse.release_date ).toBe( '2027-06-18' )
    expect( brandNewDay.release_date ).toBe( '2026-07-31' )
} )
