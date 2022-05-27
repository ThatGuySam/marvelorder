import { promises as fs } from 'fs'
// import fs from 'fs-extra'
import matter from 'gray-matter'

import { 
    getPartsFromMarkdown, 
    parseTMDbMarkdown
// @ts-ignore
} from '../markdown-page.ts' 

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