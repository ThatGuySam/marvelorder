// https://vitest.dev/api/
import { assert, expect, test } from 'vitest'
import { faker } from '@faker-js/faker'

import { 
    upsertListingFrontmatter, 
// @ts-ignore
} from '~/src/helpers/node/listing-files.ts'


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


test('Can insert listing Frontmatter Data', async () => {
    const sourceListing = {
        title: faker.lorem.sentence(),
        slug: faker.lorem.slug(), 
        overview: faker.lorem.paragraph(),
    }

    const markdownOutput = await upsertListingFrontmatter( sourceListing, { works: true } )

    // console.log('markdownOutput', markdownOutput)

    expect(markdownOutput).toContain( 'works: true' )
})

// test()