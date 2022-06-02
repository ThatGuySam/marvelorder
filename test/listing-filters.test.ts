// https://vitest.dev/api/
import { assert, expect, test } from 'vitest'
import { faker } from '@faker-js/faker'

// @ts-ignore
import { ListingFilters } from '../src/helpers/listing-filters.ts'
// @ts-ignore
import { makeMappedListings } from '../src/helpers/node/listing.ts'


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