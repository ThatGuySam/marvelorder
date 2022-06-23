// import { promises as fs } from 'fs'
import fs from 'fs-extra'
import matter from 'gray-matter'
import glob from 'fast-glob'


// @ts-ignore
import { listingsGlobPattern } from '~/src/config.ts'
import { 
    makeNewListingContents,
    getDataFromListingContents
// @ts-ignore
} from '~/src/helpers/markdown-page.ts' 

// @ts-ignore
import { Listing } from '~/src/helpers/types.ts'
// @ts-ignore
import {
    mergeListingData
// @ts-ignore
} from '~/src/helpers/node/listing.ts'
import { 
    isUpcoming, 
    FilteredListings
// @ts-ignore
} from '~/src/helpers/listing-filters.ts'

export async function getListingFiles () {
    const listingFiles = await glob(listingsGlobPattern)

    return listingFiles
}


export async function getListingFromFile ( filePath: string ) {
    const markdown = await fs.readFile( filePath, 'utf8' )

    return getDataFromListingContents({
        markdown,
        matter
    })
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

export async function getAllListings () {
    const listingFilePaths = await getListingFiles()

    const listingDetails = await getListingsFromFilePaths( listingFilePaths )

    return listingDetails
}

export async function getSingleListingFromUrl ( rawUrl: string ) {
    // Parse URL
    const url = new URL( rawUrl )
    // Get file path from URL and trim any slashes
    const urlPathname = url.pathname.replace( /^\/|\/$/g, '' )
    // Put URL pathname into path format
    const filePath = `./src/pages/${ urlPathname }.md`
    const { listing } = await getListingFromFile( filePath )


    return listing
}


export async function getListingDetailsFromPaths ( filePaths: string[] ) {
    const listings = []

    for ( const filePath of filePaths ) {
        const details = await getListingFromFile( filePath )

        // if the listing is disabled, skip it
        // Draft doubles as disable since it's used by Astro
        // https://docs.astro.build/en/guides/markdown-content/#markdown-drafts
        if ( details.listing?.draft === true ) {
            continue
        }

        listings.push( details )
    }

    return listings
}


export async function getUpcomingListings () {
    const rawListings = await getAllListings()
    
    // Filter listings
    const upcomingListings = new FilteredListings({
        listings: rawListings,
        initialFilters: [
            [ isUpcoming, true ]
        ],
        listingsSort: 'default'
    })

    return upcomingListings.list
}


export function upsertListing ( listing: Listing , data: any ) {
    
    // console.log( 'listing', listing )
    // console.log( 'data', data )

    // Merge letting the frontmatter take precedence
    return mergeListingData( listing, data )
}


export async function upsertListingFrontmatter ( listingSource: Listing | string, data: any ) {
    const sourceIsString = typeof listingSource === 'string'

    const listing = sourceIsString ? await getListingFromFile( listingSource ) : listingSource

    const {
        markdownBody,
        pageMeta
    } = await makeNewListingContents({ listing })

    const updatedListing = upsertListing( pageMeta, data )

    // console.log( 'markdownBody', markdownBody )
    // console.log( 'updatedListing', updatedListing )

    return makeTomlFromListingData( markdownBody, updatedListing )
}

export function makeTomlFromListingData ( body: string , listing: Listing ) {

    const markdownWithToml = matter.stringify( body, listing )

    return markdownWithToml
}


// Node specfic markdown writer
// since Deno uses custom fs and import method for gray-matter
export async function writeMarkdownFileNode ({ path, markdownBody, pageMeta }) {

    console.log( 'path', path )
    // console.log('markdownBody', markdownBody)
    // console.log('pageMeta', pageMeta)

    const hasPageMeta = Object( pageMeta ) === pageMeta && Object.keys(pageMeta).length > 0


    // If there is no pageMeta
    // then assume everything the body already has encoded frontmatter
    if ( !hasPageMeta ) {
        const bodyHasFrontmatter = markdownBody.startsWith('---')

        // If there is no frontmatter then throw
        if ( !bodyHasFrontmatter ) {
            throw new Error(`No frontmatter found for ${ path }`)
        }

        await fs.writeFile( path, markdownBody )

        return
    }

    const markdownContent = matter.stringify( markdownBody, pageMeta )

    // console.log('markdownContent', markdownContent)
    
    await fs.writeFile( path, markdownContent )
}