import fs from 'fs-extra'
import glob from 'fast-glob'
import matter from 'gray-matter'


import {
    storiesGlobPattern,
    avengersBackdrop
// @ts-ignore
} from '~/src/config.ts'
// @ts-ignore
import { FilteredListings } from '~/src/helpers/listing-filters.ts'
import {
    getAllListings
// @ts-ignore
} from '~/src/helpers/node/listing-files.ts'

import {
    getAllFilters
// @ts-ignore
} from '~/src/helpers/node/listing-files.ts'


export async function getStoryFiles () {
    return await glob( storiesGlobPattern )
}

interface Filter {
    exportName: string
    name: string
    slug: string
    filter: Function
}


export function getSlugFromStoryPath ( storyPath: string ) {
    return storyPath.split('/').pop().replace('.md', '')
}

export function getMissingFilterStories ( storyFilesGlob: string[], inputFilters: Filter[] ) {
    const missingFilters = Object.fromEntries( inputFilters.map( filter => [ filter.slug, filter ] ) )

    const fileSlugs = storyFilesGlob.map( getSlugFromStoryPath )

    // console.log( 'fileSlugs', fileSlugs )

    // Find and remove any filters that are in the fileSlugs
    for ( const slug of fileSlugs ) {
        if ( missingFilters[ slug ] ) {
            delete missingFilters[ slug ]
        }
    }

    return Object.values( missingFilters )
}

export async function makeFilterMarkdownContent ( filter: Filter ) {
    const { exportName, name, slug } = filter

    const isName = name.includes('Has') ? name : `is ${ name }`

    // Make the filtered list of listings
    const filteredListings = new FilteredListings({
        listings: (await getAllListings()),
        initialFilters: [
            [ filter.filter, true ]
        ],
        useDefaultFilters: false,
        listingsSort: 'default'
    })

    const listings = filteredListings.list

    // console.log( 'listings[0]', listings[0].backdrop )

    return {
        frontmatter: {
            title: `Every Marvel Film or Series that ${ isName }`,
            description: `The ${ listings.length } Marvel films or series that ${ isName }`,
            layout: '../../layouts/list-story.astro',
            coverAriaLabel: listings[0].title,
            // coverVideoUrl: https://vumbnail.com/G3-UkHQLTtw.mp4
            coverPosterUrl: listings[0].backdrop() ? listings[0].backdrop() : avengersBackdrop,
        }
    }
}

export function makeStoryPathFromFilter ( filter: Filter ) {
    const { slug } = filter

    return `src/stories/${ slug }.md`
}

export async function ensureFiltersHaveStories () {
    const storyFiles = await getStoryFiles()
    const filters = getAllFilters()

    const missingFilters = getMissingFilterStories( storyFiles, filters )

    // console.log( 'storyFiles', storyFiles )

    // Write the missing filters to a file
    for ( const missingFilter of missingFilters ) {
        const { frontmatter } = await makeFilterMarkdownContent( missingFilter )
        const markdownFilePath = makeStoryPathFromFilter( missingFilter )

        const markdownContent = matter.stringify( '', frontmatter )

        await fs.writeFile( markdownFilePath, markdownContent )
    }
}

