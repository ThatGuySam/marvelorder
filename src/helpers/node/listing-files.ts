import { promises as fs } from 'fs'
// import fs from 'fs-extra'
import matter from 'gray-matter'


import { 
    getPartsFromMarkdown, 
    parseTMDbMarkdown, 
    makeNewListingContents
// @ts-ignore
} from '~/src/helpers/markdown-page.ts' 

// @ts-ignore
import { Listing } from '~/src/helpers/types.ts'
// @ts-ignore
import {
    mergeListingData
// @ts-ignore
} from '~/src/helpers/node/listing.ts'

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

        // if the listing is disabled, skip it
        // Draft doubles as disable since it's used by Astro
        // https://docs.astro.build/en/guides/markdown-content/#markdown-drafts
        if ( listing?.draft === true ) {
            continue
        }

        listings.push( listing )
    }

    return listings
}


export function upsertListing ( listing: Listing , data: any ) {
    
    // Merge letting the frontmatter take precedence
    return mergeListingData( listing, data )
}


export async function upsertListingFrontmatter ( listingSource: Listing | string, data: any ) {
    const sourceIsString = typeof listingSource === 'string'

    const listing = sourceIsString ? await getListingFromFile( listingSource ) : listingSource

    const {
        wrappedCode,
        pageMeta
    } = await makeNewListingContents( listing )

    const updatedListing = upsertListing( pageMeta, data )

    return makeTomlFromListingData( wrappedCode, updatedListing )
}

export function makeTomlFromListingData ( body: string , listing: Listing ) {

    const markdownWithToml = matter.stringify( body, listing )

    return markdownWithToml
}