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

export function getMissingFilterStories ( storyFilesGlob: string[], inputFilters: Filter[] ) {
    let missingFilters = [ ...inputFilters ]

    const fileSlugs = storyFilesGlob.map( filePath => {
        // Get last part of file path
        const fileSlug = filePath.split('/').pop()

        // Remove the .md from the slug
        return fileSlug.replace('.md', '')
    } )

    for ( const [ index, filter ] of missingFilters.entries() ) {
        if ( fileSlugs.includes( filter.slug ) ) {
            // Remove the filter from the list of missing filters
            missingFilters.splice( index, 1 )
        }
    }

    return missingFilters
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

export async function ensureFiltersHaveStories () {
    const storyFiles = await getStoryFiles()
    const filters = getAllFilters()

    const missingFilters = getMissingFilterStories( storyFiles, filters )

    // Write the missing filters to a file
    for ( const missingFilter of missingFilters ) {
        const { frontmatter } = await makeFilterMarkdownContent( missingFilter )
        const markdownFilePath = `src/pages/stories/${ missingFilter.slug }.md`

        const markdownContent = matter.stringify( '', frontmatter )

        await fs.writeFile( markdownFilePath, markdownContent )
    }
}

