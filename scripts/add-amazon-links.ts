import fs from 'fs-extra'
import 'dotenv/config'

// @ts-ignore
import { upsertListingMarkdown } from '~/src/helpers/markdown-page.ts'
import { 
    getListingFiles,
    getListingDetailsFromPaths,
    getListingFromFile,
    writeMarkdownFileNode
// @ts-ignore
} from '~/src/helpers/node/listing-files.ts'

const amazon = require('amazon-paapi')

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

;(async () => {

    const listingFiles = await getListingFiles()

    // console.log( 'listingFiles', listingFiles )

    const rawListingsDetails = await getListingDetailsFromPaths( listingFiles )

    for ( const details of rawListingsDetails ) {
        console.log( 'rentLinks', details.listing?.rentLinks )
        // Skip listings that already have amazon links
        if ( !!details.listing?.rentLinks?.amazon ) continue


        // console.log( 'listingDetails', listingDetails )

        console.log('details.listing.title', details.listing.title )
          
        const response = await amazon.SearchItems(commonParameters, {
            Keywords: details.listing.title,
            // Official Amazon List - https://webservices.amazon.com/paapi5/documentation/locale-reference/united-states.html#search-index
            SearchIndex: 'AmazonVideo',
            ItemCount: 5,
            Resources: [
                'Images.Primary.Medium',
                'ItemInfo.Title',
                'ItemInfo.Title',
                'Offers.Listings.Price',
            ],
        })
        .catch(err => {
            console.log( 'Amazon Error', err )
        })


        console.log( 'results', response.SearchResult.Items )
        console.log( 'results', response.SearchResult.Items[0].ItemInfo.Title )

        details.listing.rentLinks = {
            amazon: response.SearchResult.Items[0].DetailPageURL,
        }

        await upsertListingMarkdown( {
            listing: details.listing,
            tmdb: details.tmdb,
            readMarkdownFile: readMarkdownFileNode,
            writeMarkdownFile: writeMarkdownFileNode,
            exists: fs.exists,
        })

        break

        // Wait for 2 seconds to avoid overloading Product Advertising API 1 request per second rate limit
        await new Promise( resolve => setTimeout( resolve, 2000 ) )
    }

    process.exit()
})()