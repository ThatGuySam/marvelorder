import { promises as fs } from 'fs'
import { DateTime } from 'luxon'
// import fs from 'fs-extra'
import matter from 'gray-matter'

// @ts-ignore
import { Listing } from './types.ts'
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


export class MappedListing {
    constructor ( listing : Listing ) {
        this.sourceListing = listing

        // Map properties from the listing
        for ( const [ key, value ] of Object.entries( listing ) ) {
            this[key] = value
        }
    }

    sourceListing

    get dateString () {
        return this.sourceListing.release_date || this.sourceListing.first_air_date
    }

    get date () {
        return DateTime.fromISO( this.dateString )
    }

    get year () {
        return this.date.year
    }
    
}