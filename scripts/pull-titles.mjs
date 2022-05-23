// Disable ESLint console logging rule for this file
/* eslint-disable */

// Helper library written for useful postprocessing tasks with Flat Data
// Has helper functions for manipulating csv, txt, json, excel, zip, and image files
// https://droces.github.io/Deno-Cheat-Sheet/
import { readJSON, writeJSON, removeFile } from 'https://deno.land/x/flat@0.0.14/mod.ts'
import 'https://deno.land/std/dotenv/load.ts'
import { exists } from 'https://deno.land/std/fs/mod.ts'
import axios from 'https://deno.land/x/axiod/mod.ts'

import { TMDB_COMPANIES, storePath } from '../src/config.ts'


// import { fetchUrlsFromGoogle } from '../src/utils/fetch-urls-from-google.mjs'
// import { downloadSite } from '../src/utils/download-site.mjs'




// async function storeDocsUrls ( newUrls ) {
//   // Get current docs urls
//   const docsUrls = await readJSON( docsUrlsPath )

//   // Merge the docsUrls with the htmlResourceUrls, remove duplicates, and sort
//   const mergedUrls = Array.from(new Set([
//     ...docsUrls,
//     ...newUrls
//   ]))
//   .sort()

//   // Save htmlResourceUrls to json
//   await writeJSON(  docsUrlsPath, mergedUrls, null, '\t' )
// }

// async function ensureRemove ( path ) {
//   if ( await exists( path ) ) {
//     await Deno.remove( path, { recursive: true })
//   }
// }


async function fetchTitles ({ company, type }) {
    const titles = {}

    let total_pages = Infinity
    let page = 1

    while ( page <= total_pages ) {

        // console.log( 'Fetching page', company )
        // console.log( 'Page', page )

        // https://www.themoviedb.org/talk/5f84426469eb900039c48872
        const requestUrl = `https://api.themoviedb.org/3/discover/${ type }?api_key=${ Deno.env.get('TMDB_API_KEY') }&language=en-US&sort_by=popularity.desc&with_companies=${ company.id }&page=${ page }`

        const { data } = await axios.get( requestUrl )
            .catch( ( error ) => {
                console.error( error )
            })

        
        for ( const result of data.results ) {

            // If we've already seen this title, add the new company to the list
            if ( titles[ result.id ] ) {
                console.log( 'Merging company', result )

                titles[ result.id ].companies.push( company )
                continue
            }

            titles[ result.id ] = {
                ...result,
                type,
                companies: [ company ]
            }
        }

        total_pages = data.total_pages
        page += 1
    }

    return titles
}

function getTitleDate ( title ) {
    if ( title?.release_date ) {
        return new Date( title.release_date )
    } else if ( title?.first_air_date ) {
        return new Date( title.first_air_date )
    }

    // If no release date or first air date
    // then push the title towards the future
    return Infinity
}

// Fetches movies from the 
async function fetchTitlesFromCompanies ( companies ) {
    const titles = {}

    for ( const company of companies ) {

        const movies = await fetchTitles ({ company, type: 'movie' })
        const tvShows = await fetchTitles ({ company, type: 'tv' })

        // Merge into titles
        for ( const id in movies ) {
            titles[ id ] = movies[ id ]
        }
        
        for ( const id in tvShows ) {
            titles[ id ] = tvShows[ id ]
        }
        
    }

    // Sort movies by release_date/first_air_date and empty first
    const sortedTitles = Object.values(titles)
        .sort((a, b) => {
            const aDate = getTitleDate(a)
            const bDate = getTitleDate(b)

            if ( aDate > bDate ) {
                return -1
            } else if ( aDate < bDate ) {
                return 1
            }
        })

    return sortedTitles
}


;(async () => {

    const titles = await fetchTitlesFromCompanies( TMDB_COMPANIES )

    await writeJSON( `${ storePath }/titles.json`, titles, null, '\t' )

    console.log('Pull complete.')

    Deno.exit()

})()