// import { promises as fs } from 'fs'
import fs from 'fs-extra'
import matter from 'gray-matter'
import glob from 'fast-glob'
import { capitalCase } from 'change-case'


// @ts-ignore
import { listingsGlobPattern } from '~/src/config.ts'
import {
    makeSlug,
    mergeListingData,
    ensureMappedListing,
    ensureMappedListings
// @ts-ignore
} from '~/src/helpers/node/listing.ts'
import {
    makeNewListingContents,
    getDataFromListingContents
// @ts-ignore
} from '~/src/helpers/markdown-page.ts'

// @ts-ignore
import { Listing } from '~/src/helpers/types.ts'
// @ts-ignore
import * as filterExports from '~/src/helpers/listing-filters.ts'

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
        const { listing, tmdb } = await getListingFromFile( filePath )

        // if the listing is disabled, skip it
        // Draft doubles as disable since it's used by Astro
        // https://docs.astro.build/en/guides/markdown-content/#markdown-drafts
        if ( listing?.draft === true ) {
            continue
        }



        // Merge listing data
        listings.push( mergeListingData( tmdb, listing ) )
    }

    return listings
}

export async function getAllListings () {
    const listingFilePaths = await getListingFiles()

    const listingDetails = await getListingsFromFilePaths( listingFilePaths )

    return listingDetails
}

export async function getAllListingsMapped () {
    const allListings = await getAllListings()
    const allListingsMapped = ensureMappedListings( allListings )

    return allListingsMapped
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

export async function getDefaultFilteredListings () {
    const rawListings = await getAllListings()

    const filteredListings = new FilteredListings({
        listings: rawListings,
        listingsSort: 'default'
    })

    return filteredListings.list
}

export async function getListingsByTitleLength () {
    const rawListings = await getAllListings()

    const listingsByTitleLength = new FilteredListings({
        listings: rawListings,
        listingsSort: 'title-length'
    })

    return listingsByTitleLength.list
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


export async function getTaggedListings ( tags: string[] ) {
    // Return empty array if no tags are provided
    if ( !tags || tags.length === 0 ) {
        return []
    }

    const rawListings = await getAllListings()

    const hasAnyTag = ( listing: Listing ) => {
        return tags.some( tag => {
            return listing.hasTag( tag )
        })
    }

    // Filter listings
    const taggedListings = new FilteredListings({
        listings: rawListings,
        initialFilters: [
            [ hasAnyTag, true ]
        ],
        listingsSort: 'default'
    })

    return taggedListings.list
}


export async function getListingsFromFilterSlug ( fromSlug:string = '' ) {
    try {
        const filter = findFilterFromSlug( fromSlug )
        const rawListings = await getAllListings()

        const filteredListings = new FilteredListings({
            listings: rawListings,
            initialFilters: [
                [ filter.filter, true ]
            ],
            listingsSort: 'default'
        })

        return filteredListings.list
    } catch ( error ) {
        return []
    }
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

    // Ensure markdown body end with newline
    markdownBody = markdownBody.endsWith( '\n' ) ? markdownBody : `${ markdownBody }\n`

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

export function getAllFilters () {
    return Object.entries( filterExports )
        // Filter out any filters that doesn't start with 'is' or 'has'
        .filter( ([ filterName ]) => filterName.startsWith('is') || filterName.startsWith('has') )
        .map( ([ exportName, filter ]) => {
            const name = capitalCase( exportName.replace( /^(is)/, '' ) )
            const slug = makeSlug( name )

            return {
                exportName,
                name,
                slug,
                filter
            }
        })
}

function findFilterFromSlug ( fromSlug:string = '' ) {
    const allFilters = getAllFilters()

    for ( const filter of allFilters ) {
        const { slug } = filter
        // const name = capitalCase( exportName.replace( /^(is)/, '' ) )
        // const slug = makeSlug( name )

        if ( fromSlug === slug ) {

            return filter
        }
    }

    throw new Error(`No filter found for slug ${ fromSlug }`)
}

export async function getListingsFromSlug ( slug:string = '' ) {
    if ( !slug ) throw new Error( 'slug must be a string' )

    const filter = findFilterFromSlug( slug )

    const baseListings = await getAllListings()

    // console.log( 'baseListings', baseListings )

    const filteredListings = new FilteredListings({
        listings: baseListings,
        initialFilters: [
            [ filter.filter, true ]
        ],
        listingsSort: 'default'
    })

    return filteredListings.list
}


export async function mapStoryContentToListings ( storyMarkdown: string ) {

    // If there's no h2 headings then return empty array
    if ( !storyMarkdown.includes('##') ) {
        return {
            cover: null,
            listings: []
        }
    }

    const markdownSections = storyMarkdown.trim().split( '##' )

    // Loop through each line to build the listings
    const listingsFromContent = await Promise.all(
        markdownSections
        .filter( section => section.trim() !== '' )
        .map( async ( lines ) => {
            const sectionDetails = {
                heading: '',
                url: '',
                description: ''
            }

            // Extract heading link and content
            const [ headingLink, ...sectionContentParts ] = lines.trim().split( '\n' ).filter( line => line.trim() !== '' )

            sectionDetails.description = sectionContentParts.join('\n')

            // If it's the cover
            // then return right now
            if ( headingLink.toLowerCase().includes('cover') ) {
                sectionDetails.heading = 'Cover'
                return sectionDetails
            }

            // Extract text and url from markdown link
            const [ sectionHeadingText, listingUrlString ] = headingLink.trim().slice(1, -1).split( '](' )

            const url = new URL( listingUrlString )

            sectionDetails.heading = sectionHeadingText
            sectionDetails.url = url.pathname

            const listing = ensureMappedListing( await getSingleListingFromUrl( listingUrlString ) )

            // Transfer sectionDetails to listing
            for ( const key of Object.keys( sectionDetails ) ) {
                listing[ key ] = sectionDetails[ key ]
            }

            return listing
        })
    )

    const [ cover, ...listings ] = listingsFromContent


    return {
        cover,
        listings//: ensureMappedListings( listings )
    }
}

function makeSlugForMatchingTitle ( string:string ) {
    let workingString = makeSlug( string )

    // Strip marvel-one-shot
    workingString = workingString.replace( /marvel-one-shot-/, '' )

    // Strip 'Marvel's ' from beginning
    const PREFIX = 'marvels-'
    if (workingString.startsWith(PREFIX)) {
        // PREFIX is exactly at the beginning
        workingString = workingString.slice(PREFIX.length);
    }


    return workingString
}

function eitherIncludes ( stringA:string, stringB:string ) {
    return stringA.includes( stringB ) || stringB.includes( stringA )
}

export function matchListingTitle ( title:string, listing:Listing ) {
    // Catch empty titles
    if ( !title.length ) {
        throw new Error( 'title must not be empty' )
    }

    const listingSlug = makeSlugForMatchingTitle( listing.title )
    const titleSlug = makeSlugForMatchingTitle( title )


    return listingSlug === titleSlug
}

export function fuzzyMatchListingTitle ( title:string, listing:Listing ) {
    // Catch empty titles
    if ( !title.length ) {
        throw new Error( 'title must not be empty' )
    }

    const listingSlug = makeSlugForMatchingTitle( listing.title )
    const titleSlug = makeSlugForMatchingTitle( title )

    // if ( listingSlug.startsWith('agents') ) {
    //     console.log( { listingSlug, titleSlug } )
    // }

    // console.log( 'listingSlug', listingSlug )
    // console.log( 'orderedSlug', inUniverseSlug )

    // Check for exact match
    if ( listingSlug === titleSlug ) {
        return true
    }

    // Check that either starts with
    if ( listingSlug.startsWith( titleSlug ) || titleSlug.startsWith( listingSlug ) ) {
        return true
    }

    // We can be a bit more generous with the slug matching
    // since the listing are all in the same month and year
    return eitherIncludes( listingSlug, titleSlug )
}
