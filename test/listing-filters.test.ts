// https://vitest.dev/api/
import { assert, expect, test } from 'vitest'
import { faker } from '@faker-js/faker'

// @ts-ignore
import { ListingFilters, FilteredListings } from '~/src/helpers/listing-filters.ts'
import {
    makeMappedListings,
// @ts-ignore
} from '~/src/helpers/node/listing.ts'

// @ts-ignore
import { getListingsFromSlug } from '~/src/helpers/node/listing-files.ts'


const fakeListing = {
    title: faker.lorem.sentence(),
    overview: faker.lorem.paragraph(),
    backdrop_path: faker.image.imageUrl(),
    genre_ids: [1, 2, 3],
    id: faker.datatype.number(),
    origin_country: [ faker.address.countryCode() ],
    original_language: faker.address.countryCode(),
    popularity: faker.datatype.number(),
    poster_path: faker.image.imageUrl(),
    slug: faker.lorem.slug(),
    tags: [ faker.lorem.word(), faker.lorem.word() ]
}


test('Can filter out docs by default', () => {

    const apiListings = [
        fakeListing,
        { ...fakeListing, tags: [ 'doc' ] },
    ]

    const mappedListings = makeMappedListings( apiListings )

    const listingFilters = new ListingFilters()

    const filteredListings = listingFilters.filter( mappedListings )

    expect(filteredListings).toHaveLength( 1 )

    // https://vitest.dev/api/#tocontain
    expect(filteredListings[0]).not.toContain( { tags: [ 'doc' ] } )

})

test('Can filter out docs from FilteredListings by default', () => {

    const apiListings = [
        fakeListing,
        { ...fakeListing, tags: [ 'doc' ] },
    ]

    const mappedListings = makeMappedListings( apiListings )

    const filteredListings = new FilteredListings({ listings: mappedListings, listingsSort: 'none' })

    expect( filteredListings.list ).toHaveLength( 1 )

    // https://vitest.dev/api/#tocontain
    expect( filteredListings.first ).not.toContain( { tags: [ 'doc' ] } )

})


test('Can match listings from slugs', async () => {
    // Match Phase Zero
    const phaseZeroListings = await getListingsFromSlug( 'phase-zero' )

    // Check that list is not empty
    expect( phaseZeroListings.length ).toBeGreaterThan( 0 )

    // console.log( 'phaseZeroListings', phaseZeroListings[0].title )

    // Check that list does not contain Iron Man from 2008
    expect( phaseZeroListings ).toEqual(
        expect.arrayContaining([
            // Iron Man 2008
            expect.not.objectContaining({
                year: 2008
            }),

            // Probably Fantastic Four: Rise of the Silver Surfer
            expect.objectContaining({
                title: expect.stringContaining('Fantastic Four'),
                year: 2007
            }),

            // Blade
            expect.objectContaining({
                title: 'Blade'
            }),
        ])
    )


    // Match MCU
    const mcuListings = await getListingsFromSlug( 'mcu' )

    // console.log('mcuListings', mcuListings[ 25 ].year )

    // Check that list is not empty
    expect( mcuListings.length ).toBeGreaterThan( 0 )

    // Check that list does not contain Iron Man from 2008
    expect( mcuListings ).toEqual(
        expect.arrayContaining([
            // Probably Fantastic Four: Rise of the Silver Surfer
            expect.not.objectContaining({
                year: 2007
            }),

            // Iron Man 2008
            expect.objectContaining({
                title: 'Iron Man',
                year: 2008
            }),

            // Infinity War
            expect.objectContaining({
                title: expect.stringContaining('Infinity War'),
                year: 2018
            }),
        ])
    )

})
