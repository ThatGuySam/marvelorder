import { promises as fs } from 'fs'
// import fs from 'fs-extra'
import matter from 'gray-matter'

import { 
    getPartsFromMarkdown, 
    parseTMDbMarkdown
// @ts-ignore
} from '~/src/helpers/markdown-page.ts' 

export function getDataFromListingContents ( markdown: string ) {
    const { tmdbContent } = getPartsFromMarkdown( markdown )

    const frontmatter = matter( markdown ).data
    const tmdb = parseTMDbMarkdown( tmdbContent )

    return {
        // Merge letting the frontmatter take precedence
        listing: {
            ...tmdb,
            ...frontmatter
        },
        frontmatter,
        tmdb,
    }
}

export async function getListingFromFile ( filePath: string ) {
    const markdown = await fs.readFile( filePath, 'utf8' )

    return getDataFromListingContents( markdown )
}

export async function getListingsFromFilePaths ( filePaths: string[] ) {
    const listings = []

    for ( const filePath of filePaths ) {
        const { listing } = await getListingFromFile( filePath )

        // if the listing is diabled, skip it
        // Drafft doubles as disable since it's used by Astro
        // https://docs.astro.build/en/guides/markdown-content/#markdown-drafts
        if ( listing?.draft === true ) {
            continue
        }

        listings.push( listing )
    }

    return listings
}
