import fs from 'fs-extra'

// @ts-ignore
import { upsertListingMarkdown } from '~/src/helpers/markdown-page.ts'
import { 
    getListingFiles,
    getListingDetailsFromPaths,
    getListingFromFile,
    writeMarkdownFileNode
// @ts-ignore
} from '~/src/helpers/node/listing-files.ts'
// @ts-ignore
import { ensureMappedListings } from '~/src/helpers/node/listing.ts'

async function readMarkdownFileNode ( filePath: string ) {
    // const markdownContent = await fs.readFile( filePath, 'utf8' )

    return await getListingFromFile( filePath )
}

;(async () => {

    // console.log('getListingFiles', getListingFiles)

    const listingFiles = await getListingFiles()

    // console.log( 'listingFiles', listingFiles )

    const rawListingsDetails = await getListingDetailsFromPaths( listingFiles )

    // const mappedListings = ensureMappedListings( rawListings )

    // console.log( 'allListings', mappedListings[0] )

    rawListingsDetails[0].listing.tags = [ 'can-add-from-amazon-script' ]

    // console.log( 'rawListingsDetails', rawListingsDetails[0] )

    await upsertListingMarkdown( {
        listing: rawListingsDetails[0].listing,
        tmdb: rawListingsDetails[0].tmdb,
        readMarkdownFile: readMarkdownFileNode,
        writeMarkdownFile: writeMarkdownFileNode,
        exists: fs.exists
    })

    process.exit()
})()