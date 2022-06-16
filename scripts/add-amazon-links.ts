// @ts-ignore
import { upsertListingMarkdown } from '~/src/helpers/markdown-page.ts'
// @ts-ignore
import { getListingFiles } from '~/src/helpers/node/listing-files.ts'

;(async () => {

    // console.log('getListingFiles', getListingFiles)

    const listingFiles = await getListingFiles()

    console.log( 'listingFiles', listingFiles )

    // await upsertListingMarkdown( {
    //     listing,
    //     readFile: async filePath =>  new TextDecoder( 'utf-8' ).decode( await Deno.readFile( filePath ) ),
    //     writeMarkdownFile: writeMarkdownFileDeno,
    //     exists: exists
    // })


    process.exit()
})()