// https://vitest.dev/api/
import { assert, expect, test } from 'vitest'
import { faker } from '@faker-js/faker'

import { 
    upsertListingFrontmatter, 
    getListingFiles, 
    getListingDetailsFromPaths,
// @ts-ignore
} from '~/src/helpers/node/listing-files.ts'

import {
    getInUniverseTimeline
// @ts-ignore
} from '~/src/helpers/node/in-universe-timeline.ts'


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

test('Can merge Frontmatter arrays', async () => {
    const sourceListing = {
        title: faker.lorem.sentence(),
        slug: faker.lorem.slug(), 
        overview: faker.lorem.paragraph(),
        tags: [ 'can-retain-tags' ]
    }

    const markdownOutput = await upsertListingFrontmatter( sourceListing, { tags: [ 'can-add-tags' ] } )

    // console.log('markdownOutput', markdownOutput)

    expect(markdownOutput).toContain( '- can-add-tags' )
    expect(markdownOutput).toContain( '- can-retain-tags' )

})

function noEndingBackSlashes( arrayOrObject ) {

    const array = Array.isArray( arrayOrObject ) ? arrayOrObject : Object.values( arrayOrObject )

    for (const value of array) {

        if ( typeof value === 'string' && value.endsWith('\\') ) {
            console.log( 'value', value )
            return false
        }

        if ( Object( value ) === value || Array.isArray( value ) ) {
          const child = noEndingBackSlashes( value )

          if (!child) return false
        }
    }

    return true
}

test('No listing frontmatter properties end with backward slash', async () => {
    const listingFiles = await getListingFiles()

    // console.log( 'listingFiles', listingFiles )

    const details = await getListingDetailsFromPaths( listingFiles )

    expect( noEndingBackSlashes( details ) ).toBe( true )
})


test('Can get Disney+ In Universe Timeline', async () => {
    
    const universeTimeline = await getInUniverseTimeline()

    expect( universeTimeline ).toBeDefined()
    expect( universeTimeline.length ).toBeGreaterThan( 0 )

    expect( universeTimeline[0].title ).toContain('First Avenger')

})