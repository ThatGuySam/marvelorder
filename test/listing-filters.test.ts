// https://vitest.dev/api/
import { assert, expect, test } from 'vitest'
import { faker } from '@faker-js/faker'

// @ts-ignore
import { ListingFilters, FilteredListings } from '~/src/helpers/listing-filters.ts'
import {
    makeMappedListings,
// @ts-ignore
} from '~/src/helpers/node/listing.ts'

import {
    getListingsFromSlug,
    getAllFilters
// @ts-ignore
} from '~/src/helpers/node/listing-files.ts'

import {
    makeFilterMarkdownContent,
    getMissingFilterStories,
    makeStoryPathFromFilter
// @ts-ignore
} from '~/src/helpers/node/markdown-files.ts'


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


test('Can list all filters', () => {

    const filters = getAllFilters()

    // console.log( 'filters', filters )

    // https://vitest.dev/api/#tocontain
    expect( filters ).not.toHaveLength( 0 )

    // Expected filters
    expect( filters ).toEqual(
        expect.arrayContaining([

            // Expect a filter with the exportName isMultiverseSaga
            expect.objectContaining({
                exportName: 'isMultiverseSaga'
            }),

            // Expect a filter with the slug infinity-saga
            expect.objectContaining({
                slug: 'infinity-saga'
            }),

            // Expect a filter with the name 'Marvel Knights Animated'
            expect.objectContaining({
                name: 'Marvel Knights Animated'
            }),
        ])
    )

    const nonFilterExportNames = new Set([
        'matchesFilters',
        'defaultFilters',
        'ListingFilters',
        'FilteredListings',
        // 'isMarvelKnightsAnimated',
    ])

    for ( const exportName of nonFilterExportNames ) {

        // Exoected filters not to be found
        expect( filters ).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    exportName
                })
            ])
        )

    }

})



test('Can match missing story pages', () => {

    const expectedMissingFilters = [
        {
            exportName: 'isMarvelKnightsAnimated',
            name: 'Marvel Knights Animated',
            slug: 'marvel-knights-animated'
        },
        {
            exportName: 'shouldBeMissing',
            name: 'Should Be Missing',
            slug: 'missing'
        }
    ]

    const existingFiles = [
        'src/pages/stories/she-hulk-watch-list.md',
        'src/pages/stories/animated-genre.md',
        'src/pages/stories/doc.md',
        'src/pages/stories/groot-episode.md',
        'src/pages/stories/has-any-genres.md',
        'src/pages/stories/has-any-tags.md',
        'src/pages/stories/has-fanart-logo.md',
        'src/pages/stories/has-logo.md',
        'src/pages/stories/infinity-saga.md',
        'src/pages/stories/marvel-knights.md',
        'src/pages/stories/marvel-studios.md',
        'src/pages/stories/mcu-sheet-ordered.md',
        'src/pages/stories/mcu.md',
        'src/pages/stories/multiverse-saga.md',
        'src/pages/stories/phase-five.md',
        'src/pages/stories/phase-four.md',
        'src/pages/stories/phase-one.md',
        'src/pages/stories/phase-six.md',
        'src/pages/stories/phase-three.md',
        'src/pages/stories/phase-two.md',
        'src/pages/stories/phase-zero.md',
        'src/pages/stories/she-hulk-watch-list.md',
        'src/pages/stories/thor-anthology.md',
        'src/pages/stories/upcoming.md',

        // 'src/pages/stories/marvel-knights-animated.md',
        // 'src/pages/stories/missing.md',

        'src/pages/stories/show.md',
        'src/pages/stories/existing.md',
    ]

    const inputFilters = [
        {
            exportName: 'isShow',
            name: 'Is Show',
            slug: 'show'
        },
        {
            exportName: 'shouldBeExisting',
            name: 'Should Be Existing',
            slug: 'existing'
        },

        ...expectedMissingFilters
    ]


    const missingFilters = getMissingFilterStories( existingFiles, inputFilters )

    // console.log( 'missingFilters', missingFilters )

    // Expected filters
    expect( missingFilters ).toEqual( expectedMissingFilters )

})


test('Can make markdown file content from filter', async () => {
    const filters = getAllFilters()

    const markdownFilesContent = await Promise.all(filters.map( filter => {
        return makeFilterMarkdownContent( filter )
    } ))

    // console.log( 'markdownFilesContent', markdownFilesContent )


    expect( markdownFilesContent ).toEqual(
        expect.arrayContaining([
            expect.objectContaining({

                frontmatter: expect.objectContaining({
                    title: expect.stringContaining('Every Marvel Film or Series that is Marvel Knights Animated'),
                })

            }),
        ])
    )

})
