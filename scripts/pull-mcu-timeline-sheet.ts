import fs from 'fs-extra'
import 'dotenv/config'
import axios from 'axios'

// @ts-ignore
import { storePath } from '~/src/config.ts'
// @ts-ignore
import {
    organizeOrderData,
    matchListingToOrdered,
// @ts-ignore
} from '~/src/helpers/node/mcu-timeline-sheet.ts'
import {
    updateReadmeListContent,
    makeUpcomingListingsMarkdown,
    makeInUniverseMarkdown
// @ts-ignore
} from '~/src/helpers/node/readme.ts'
// @ts-ignore
import { upsertListingMarkdown } from '~/src/helpers/markdown-page.ts'
// @ts-ignore
import {
    getListingFiles,
    getListingDetailsFromPaths,
    getListingFromFile,
    writeMarkdownFileNode,
    getUpcomingListings
// @ts-ignore
} from '~/src/helpers/node/listing-files.ts'
import {
	isUpcoming,
	FilteredListings
} from '~/src/helpers/listing-filters'

import {
    ensureFiltersHaveStories
// @ts-ignore
} from '~/src/helpers/node/markdown-files.ts'

// @ts-ignore
import { saveMoviesFandomTimeline } from '~/src/helpers/node/movies-fandom-timeline.ts'


const macroUrl = 'https://script.google.com/macros/s/AKfycbzGvKKUIaqsMuCj7-A2YRhR-f7GZjl4kSxSN1YyLkS01_CfiyE/exec'
const mcuTimelineSheetId = '1Xfe--9Wshbb3ru0JplA2PnEwN7mVawazKmhWJjr_wKs'

async function readMarkdownFileNode ( filePath: string ) {
    // const markdownContent = await fs.readFile( filePath, 'utf8' )

    return await getListingFromFile( filePath )
}

const typesReadmeMap = {
    'movie': '🎬 Marvel Studios',
    'abc': '⚫️ ABC',
    'freeform': '🔵 Freeform',
    'sony': '🕷 Sony',
    'disney-plus-netflix': '🟥 Netflix',
    'disney-plus': '🏰 Disney+',
    'hulu': '🟩 Hulu',
}

function buildReadmeList ( matchesMap:Map<number, any> ) {
    const matches = Array.from( matchesMap.values() )

    const readmeListLines = matches.map( ( match:any, index ) => {
        const { listing, timelineType } = match
        const parts = [
            '',
            `<kbd>${ index + 1 }</kbd>`,
            `[${ listing.title }](https://marvelorder.com${ listing.endpoint })`,
            typesReadmeMap[ timelineType ],
            `[Edit](${ listing.githubEditUrl })`
        ]

        return parts.join( ' - ' ).trim()
    })

    return '\n\n' + readmeListLines.join( '\n' ) + '\n\n'
}

;(async () => {

    const listingFiles = await getListingFiles()

    // console.log( 'listingFiles', listingFiles )

    const listingsDetails = await getListingDetailsFromPaths( listingFiles )
    // const listingDetailsMap = new Map( listingsDetails.map( ( details:any ) => [ details.listing.id, details ] ) )
    const allListings = listingsDetails.map( ( details:any ) => details.listing )


    // const orderableListings = new FilteredListings({
    //     listings: allListings,
    //     // initialFilters: new Map([
    //     //     [ isUpcoming, false ]
    //     // ])
    //     listingsSort: 'default'
    // })


    // const sheet = await axios( macroUrl, {
    //     params: {
    //         id: mcuTimelineSheetId,
    //         sheet: 'Chronological Order',
    //         header: 1,
    //         startRow: 4
    //     }
    // } ).then( res => {
    //     return {
    //         ...res.data,
    //         records: res.data.records.map( ( record:any, recordIndex ) => {
    //             const cleanedRecordEntries = Object.entries( record )
    //                 .filter( ( [ key ] ) => {
    //                     const hasKey = key.length > 0

    //                     return hasKey
    //                 } )
    //                 .map( ( [ key, value ]:any ) => {
    //                     const isNotes = key.toLowerCase() === 'notes'

    //                     if ( !isNotes ) {
    //                         return [ key, value ]
    //                     }

    //                     const isBelowDetailsRows = recordIndex > 30

    //                     return [
    //                         key,
    //                         isBelowDetailsRows ? value : ''
    //                     ]
    //                 } )

    //             // console.log( 'cleanedRecordEntries', cleanedRecordEntries )

    //             return Object.fromEntries( cleanedRecordEntries )
    //         })
    //     }
    // } )

    // // Write data to JSON
    // await fs.writeFile( storePath + '/mcu-timeline-sheet.json', JSON.stringify( sheet, null, 2 ) )


    // const orderedDetails = organizeOrderData( sheet.records )

    // const matches = new Map()

    // // console.log('orderedDetails', orderedDetails)

    // const matchableOrderedTypes = new Set([
    //     'movie',
    //     'disney-plus',
    //     'disney-plus-netflix',
    //     'abc',
    //     'freeform',
    //     'hulu',
    //     'web-series',
    //     'sony',

    //     // 'whih',
    //     // 'other'
    // ])

    // for ( const entry of Object.entries( orderedDetails ) ) {
    //     const [
    //         ,
    //         orderedDetails = null as any
    //     ] = entry

    //     // console.log('orderedDetails.timelineType', orderedDetails.timelineType)

    //     // Skip entries not from matchable types
    //     if ( !matchableOrderedTypes.has( orderedDetails.timelineType ) ) continue


    //     // console.log('details', details )

    //     for ( const listing of orderableListings.list ) {
    //         const details:any = listingDetailsMap.get( listing.id )

    //         const alreadyMatched = matches.has( listing.id )

    //         if ( !alreadyMatched && matchListingToOrdered( listing, orderedDetails )  ) {

    //             // console.log( 'Match!', 1, orderedDetails.title, 2, details.listing.title, getYearAndMonth( orderedDetails.premiereDate ) )

    //             matches.set( details.listing.id, {
    //                 ...orderedDetails,
    //                 listing
    //             } )


    //             await upsertListingMarkdown( {
    //                 listing: {
    //                     id: details.listing.id,
    //                     slug: listing.slug,
    //                     overview: listing.sourceListing.description,
    //                     title: listing.title,

    //                     mcuTimelineOrder: orderedDetails.mcuTimelineOrder,
    //                 },
    //                 tmdb: {},
    //                 readMarkdownFile: readMarkdownFileNode,
    //                 writeMarkdownFile: writeMarkdownFileNode,
    //                 exists: fs.exists,
    //             })
    //         }
    //     }
    // }


    console.log( '⚠️ MCU SHEET DISABLED' )

    // console.log( 'Updating README viewing-order-list' )

    // const updatedList = buildReadmeList( matches )

    // // console.log( 'updatedList', updatedList )

    // await updateReadmeListContent( updatedList, 'viewing-order-list' )

    // console.log( 'Done' )



    console.log( 'Updating README in-universe-list' )

    const inUniverseList = await makeInUniverseMarkdown()

    // console.log( 'updatedList', updatedList )

    await updateReadmeListContent( inUniverseList, 'in-universe-list' )

    console.log( 'Done' )



    console.log( 'Updating README upcoming-list' )

    const upcomingListings = await getUpcomingListings()

    // Generate markdown
    const newUpcomingMarkdown = makeUpcomingListingsMarkdown( upcomingListings )

    await updateReadmeListContent( newUpcomingMarkdown, 'upcoming-list' )

    console.log( 'Done' )


    console.log( 'Saving Marvel Movies Fandom Timeline' )

    try {
        await saveMoviesFandomTimeline()

        console.log( 'Done' )
    } catch ( error ) {
        console.log( 'Error', error )
    }


    console.log( 'Adding any new filters as stories' )

    await ensureFiltersHaveStories()

    console.log( 'Done' )



    console.log( 'Finished All README Updates' )

    process.exit()
})()
