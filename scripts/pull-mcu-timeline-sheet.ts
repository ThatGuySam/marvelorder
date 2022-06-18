import fs from 'fs-extra'
import 'dotenv/config'
import axios from 'axios'

// @ts-ignore
import { storePath } from '~/src/config.ts'
// @ts-ignore
import { fuzzyMatchesWholeWord } from '~/src/helpers/matching.ts'
// @ts-ignore
import { 
    organizeOrderData, 
    matchListingToOrdered,
// @ts-ignore
} from '~/src/helpers/node/mcu-timeline-sheet.ts'
// @ts-ignore
import { upsertListingMarkdown } from '~/src/helpers/markdown-page.ts'
// @ts-ignore
import {
    getListingFiles,
    getListingDetailsFromPaths,
    getListingFromFile,
    writeMarkdownFileNode
// @ts-ignore
} from '~/src/helpers/node/listing-files.ts'
import { 
	isUpcoming, 
	FilteredListings
} from '~/src/helpers/listing-filters'


const macroUrl = 'https://script.google.com/macros/s/AKfycbzGvKKUIaqsMuCj7-A2YRhR-f7GZjl4kSxSN1YyLkS01_CfiyE/exec'
const mcuTimelineSheetId = '1Xfe--9Wshbb3ru0JplA2PnEwN7mVawazKmhWJjr_wKs'

async function readMarkdownFileNode ( filePath: string ) {
    // const markdownContent = await fs.readFile( filePath, 'utf8' )

    return await getListingFromFile( filePath )
}

;(async () => {

    const listingFiles = await getListingFiles()

    // console.log( 'listingFiles', listingFiles )

    const listingsDetails = await getListingDetailsFromPaths( listingFiles )
    const listingDetailsMap = new Map( listingsDetails.map( ( details:any ) => [ details.listing.id, details ] ) )
    const allListings = listingsDetails.map( ( details:any ) => details.listing )


    const orderableListings = new FilteredListings({ 
        listings: allListings, 
        // initialFilters: new Map([
        //     [ isUpcoming, false ]
        // ]) 
        listingsSort: 'default'
    })


    const sheet = await axios( macroUrl, {
        params: {
            id: mcuTimelineSheetId, 
            sheet: 'Chronological Order', 
            header: 1,
            startRow: 4
        }
    } ).then( res => res.data )

    // Write data to JSON
    await fs.writeFile( storePath + '/mcu-timeline-sheet.json', JSON.stringify( sheet, null, 2 ) )


    const orderedDetails = organizeOrderData( sheet.records )

    const matches = new Map()

    // console.log('orderedDetails', orderedDetails)

    const matchableOrderedTypes = new Set([
        'movie', 
        'disney-plus', 
        'disney-plus-netflix',
        'abc',
        'freeform',
        'hulu',
        'web-series', 
        'sony', 

        // 'whih', 
        // 'other'
    ])

    for ( const entry of Object.entries( orderedDetails ) ) {
        const [ 
            , 
            orderedDetails = null as any
        ] = entry

        // console.log('orderedDetails.timelineType', orderedDetails.timelineType) 

        // Skip entries not from matchable types
        if ( !matchableOrderedTypes.has( orderedDetails.timelineType ) ) continue

        
        // console.log('details', details )

        for ( const listing of orderableListings.list ) {
            const details:any = listingDetailsMap.get( listing.id )

            const alreadyMatched = matches.has( listing.id )

            if ( !alreadyMatched && matchListingToOrdered( listing, orderedDetails )  ) {

                // console.log( 'Match!', 1, orderedDetails.title, 2, details.listing.title, getYearAndMonth( orderedDetails.premiereDate ) )

                matches.set( details.listing.id, orderedDetails )


                await upsertListingMarkdown( {
                    listing: {
                        id: details.listing.id,
                        slug: listing.slug,
                        overview: listing.sourceListing.description,
                        title: listing.title,

                        mcuTimelineOrder: orderedDetails.mcuTimelineOrder,
                    },
                    tmdb: {},
                    readMarkdownFile: readMarkdownFileNode,
                    writeMarkdownFile: writeMarkdownFileNode,
                    exists: fs.exists,
                })
            }
        }
    }
    
    process.exit()
})()