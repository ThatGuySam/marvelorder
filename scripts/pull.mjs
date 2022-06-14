// Disable ESLint console logging rule for this file
/* eslint-disable */

// Helper library written for useful postprocessing tasks with Flat Data
// Has helper functions for manipulating csv, txt, json, excel, zip, and image files
// https://droces.github.io/Deno-Cheat-Sheet/
import { writeJSON } from 'https://deno.land/x/flat@0.0.14/mod.ts'
import { exists } from "https://deno.land/std/fs/mod.ts"

import 'https://deno.land/std/dotenv/load.ts'
import { slugify } from 'https://deno.land/x/slugify/mod.ts'
import axios from 'https://deno.land/x/axiod/mod.ts'
import matter from 'https://jspm.dev/gray-matter'
import { deepmerge, deepmergeCustom } from 'https://deno.land/x/deepmergets@v4.0.3/dist/deno/mod.ts'

import { 
    TMDB_COMPANIES, 
    TMDB_LISTS, 
    storePath 
} from '../src/config.ts'
import { byListingDate } from '../src/helpers/sort.ts'
import { 
    makeTMDbMarkdownSection, 
    makeNewListingContents,
    getPartsFromMarkdown
} from '../src/helpers/markdown-page.ts'
import { 
    makeListingEndpoint, 
    listingMergeConfig
} from '../src/helpers/listing.ts'

// https://github.com/RebeccaStevens/deepmerge-ts/blob/beae8b841561bd206150ef02fe10db94856c6e45/docs/deepmergeCustom.md
const deepmergeListings = deepmergeCustom( listingMergeConfig )

function makeSlug ( name ) {
    return slugify(name, {
        lower: true,
        remove: /[^a-zA-Z\d\s\-]/g,
        strict: true
    })
}

function cleanListings ( fetchedListings ) {
    const listings = {}

    for ( const id in fetchedListings ) {

        // Delete noisy properties
        // so we don't get a bunch of noise in our commits
        delete fetchedListings[id].popularity
        delete fetchedListings[id].vote_count
        

    }

    return fetchedListings
}

async function fetchListings ({ 
    endpoint, 
    params = {},
    listKey = 'results',
    tags = []
} = {}) {
    const fetchedListings = {}

    let total_pages = Infinity
    let page = 1

    while ( page <= total_pages ) {

        // console.log( 'Fetching page', company )
        // console.log( 'Page', page )

        // https://www.themoviedb.org/talk/5f84426469eb900039c48872
        const requestUrl = `https://api.themoviedb.org${ endpoint }`

        const requestOptions = {
            params: {
                api_key: Deno.env.get('TMDB_API_KEY'),
                // language: 'en-US',
                // sort_by: 'popularity.desc',
                // with_companies: company.id,
                page,

                // Merge in params
                ...params
            }
        }

        const { data } = await axios.get( requestUrl, requestOptions )
            .catch( ( error ) => {
                console.error( error )
            })

        
        for ( const result of data[ listKey ] ) {

            // If we've already seen this title, add the new company to the list
            if ( fetchedListings[ result.id ] ) {
                continue
            }

            const title = result.name || result.title
            const slug = makeSlug( title )

            fetchedListings[ result.id ] = {
                ...result,
                title,
                slug,
                tags,
            }
        }

        total_pages = data.total_pages || 1
        page += 1
    }

    return cleanListings( fetchedListings )
}

// Fetches movies from the 
async function fetchListingsFromCompanies ( companies ) {
    const listings = {}

    for ( const company of companies ) {

        const movies = await fetchListings({ 
            endpoint: `/3/discover/movie`, 
            params: { with_companies: company.id }, 
            tags: [ 'movie', `company-${ company.id }` ]
        })
        const tvShows = await fetchListings({ 
            endpoint: `/3/discover/tv`, 
            params: { with_companies: company.id }, 
            tags: [ 'tv', `company-${ company.id }` ]
        })

        // Merge into listings
        for ( const id in movies ) {
            listings[ id ] = deepmergeListings( movies[ id ], listings[ id ] || {} ) 
        }
        
        for ( const id in tvShows ) {
            listings[ id ] = deepmergeListings( tvShows[ id ], listings[ id ] || {} ) 
        }
        
    }

    // Sort movies by release_date/first_air_date and empty first
    // const sortedListings = Object.values(listings)
    //     .sort( byListingDate )

    return listings
}


async function fetchListingsFromLists ( lists ) {
    const listings = {}

    for ( const list of lists ) {

        const fetchedListings = await fetchListings({ 
            // https://api.themoviedb.org/3/list/8204859?append_to_response=videos,images,company&api_key={{API_KEY}}
            endpoint: `/3/list/${ list.id }`, 
            params: {
                append_to_response: 'videos,images,company'
            },
            tags: [ `list-${ list.id }` ], 
            listKey: 'items'
        })

        // Merge into listings
        for ( const id in fetchedListings ) {
            listings[ id ] = deepmergeListings( fetchedListings[ id ], listings[ id ] || {} ) 
        }
        
    }

    return listings//sortedListings
}


async function saveListingsAsMarkdown ( listings ) {

    for ( const listing of listings ) {

        const filePath = `${ storePath }/${ makeListingEndpoint( listing ) }.md`
        const hasExistingFile = await exists( filePath )

        let content = ''
        
        // If there's no existing file, create one with meta data from our listing
        if ( hasExistingFile ) {
            const decoder = new TextDecoder( 'utf-8' )
            const markdownContent = decoder.decode(await Deno.readFile( filePath ))
            // Split off and leave behind existing TMDb data
            const { existingContent } = getPartsFromMarkdown( markdownContent )

            // Merge in existing meta above the current TMDb data
            content = [
                existingContent.trim(),
                makeTMDbMarkdownSection( listing )
            ].join('\n')

        } else {
            const {
                wrappedCode,
                pageMeta
            } = await makeNewListingContents( listing )

            // console.log('wrappedCode', wrappedCode)
            // console.log('pageMeta', pageMeta)

            content = matter.stringify( wrappedCode, pageMeta )
        }

        await Deno.writeTextFile( filePath, content )

    }
}

;(async () => {
    
    let listings = []

    const companylistings = await fetchListingsFromCompanies( TMDB_COMPANIES )

    const listListings = await fetchListingsFromLists( TMDB_LISTS )

    // console.log('listListings', listListings[ 668 ] )
    // console.log('companylistings', companylistings.find( ( listing ) => listing.id === 668 ))

    listings = deepmergeListings( companylistings, listListings )

    // console.log('listings', listings[ 668 ])

    // Sort movies by release_date/first_air_date and empty first
    const sortedListings = Object.values(listings)
        .sort( byListingDate )


    await writeJSON( `${ storePath }/en/listings.json`, sortedListings, null, '\t' )

    await saveListingsAsMarkdown( sortedListings )

    console.log('Pull complete.')

    Deno.exit()

})()