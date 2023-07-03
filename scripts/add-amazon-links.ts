import fs from 'fs-extra'
import 'dotenv/config'

// @ts-expect-error
import { upsertListingMarkdown } from '~/src/helpers/markdown-page.ts'
import {
    getListingDetailsFromPaths,
    getListingFiles,
    getListingFromFile,
    writeMarkdownFileNode,
// @ts-expect-error
} from '~/src/helpers/node/listing-files.ts'
import {
    FilteredListings,
    isUpcoming,
} from '~/src/helpers/listing-filters'

const amazon = require( 'amazon-paapi' )

const commonParameters = {
    AccessKey: process.env.AWS_ACCESS,
    SecretKey: process.env.AWS_SECRET,
    PartnerTag: process.env.AWS_TRACKING,
    PartnerType: 'Associates', // Default value is Associates.
    // Marketplace: 'www.amazon.com', // Default value is US. Note: Host and Region are predetermined based on the marketplace value. There is no need for you to add Host and Region as soon as you specify the correct Marketplace value. If your region is not US or .com, please make sure you add the correct Marketplace value.
}

async function readMarkdownFileNode ( filePath: string ) {
    // const markdownContent = await fs.readFile( filePath, 'utf8' )

    return await getListingFromFile( filePath )
}

( async () => {
    const listingFiles = await getListingFiles()

    // console.log( 'listingFiles', listingFiles )

    const rawListingsDetails = await getListingDetailsFromPaths( listingFiles )

    const listingDetailsMap = new Map( rawListingsDetails.map( ( details: any ) => [ details.listing.id, details ] ) )
    const allListings = rawListingsDetails.map( ( details: any ) => details.listing )

    const rentableListings = new FilteredListings( {
        listings: allListings,
        initialFilters: new Map( [
            [ isUpcoming, false ],
        ] ),
        listingsSort: 'default',
    } )

    for ( const listing of rentableListings.list ) {
        const details: any = listingDetailsMap.get( listing.id )

        // console.log( 'watchLinks', details.listing?.watchLinks )
        // Skip listings that already have amazon links
        if ( details.listing?.watchLinks?.amazon ) { continue }

        const searchKeywords = [
            details.listing.title,
            listing.date.year,
        ].join( ' ' )

        console.log( 'Searching for', searchKeywords )

        const response = await amazon.SearchItems( commonParameters, {
            Keywords: searchKeywords,
            // Official Amazon List - https://webservices.amazon.com/paapi5/documentation/locale-reference/united-states.html#search-index
            SearchIndex: 'AmazonVideo',
            ItemCount: 3,
            Resources: [
                'Images.Primary.Medium',
                'ItemInfo.Title',
                'ItemInfo.Title',
                'Offers.Listings.Price',
            ],
        } )
            .catch( ( err ) => {
                console.log( 'Amazon Error', err )
            } )

        console.log( 'results', response.SearchResult.Items )
        console.log( 'results', response.SearchResult.Items[ 0 ].ItemInfo.Title )

        details.listing.watchLinks = {
            amazon: response.SearchResult.Items[ 0 ].DetailPageURL,
        }

        await upsertListingMarkdown( {
            listing: details.listing,
            tmdb: details.tmdb,
            readMarkdownFile: readMarkdownFileNode,
            writeMarkdownFile: writeMarkdownFileNode,
            exists: fs.exists,
        } )

        break

        // Wait for 2 seconds to avoid overloading Product Advertising API 1 request per second rate limit
        await new Promise( resolve => setTimeout( resolve, 2000 ) )
    }

    process.exit()
} )()
