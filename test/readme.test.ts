import { expect, test } from 'vitest'

import { getUpcomingListings } from '~/src/helpers/node/listing-files.ts'
import {
    makeUpcomingListingsMarkdown,
    updateMarkdownContent,
} from '~/src/helpers/node/readme.ts'

const testMarkdown = `
<!-- start-upcoming-list -->

- 05-2021 - [Old Listing](https://marvelorder.com/) - 🎬 Marvel Studios - [Edit](https://github.com/ThatGuySam/marvelorder/blob/main/src/pages/en/doctor-strange-in-the-multiverse-of-madness-453395.md)
- 06-2021 - [Another Old Listing](https://marvelorder.com/) - 🏰 Disney+ - [Edit](https://github.com/ThatGuySam/marvelorder/blob/main/src/pages/en/ms-marvel-92782.md)

<!-- end-upcoming-list -->
`

test( 'Can generate upcoming Listing Markdown', async () => {
    const upcomingListings = await getUpcomingListings()

    const [ nextUpcomingListing ] = upcomingListings

    // Expect first mark to have a date of this current month or in the future
    expect( Number( nextUpcomingListing.date ) ).toBeGreaterThan( Date.now() )

    // Generate markdown
    const newUpcomingMarkdown = makeUpcomingListingsMarkdown( upcomingListings )

    const newReadmeListContent = updateMarkdownContent( {
        sourceMarkdown: testMarkdown,
        newMarkdown: newUpcomingMarkdown,
        markerString: 'upcoming-list',
    } )

    // Expect markdown to have list markers
    expect( newReadmeListContent ).toContain( '<!-- start-upcoming-list -->' )

    // console.log( 'upcomingMarkdown', upcomingMarkdown )

    // Expect upcomingMarkdown to not contain 'Old Listing'
    expect( newReadmeListContent ).not.toContain( 'Old Listing' )
} )

test( 'Can catch missing start marker', async () => {
    const emptyMarkdown = ''

    expect( () => {
        updateMarkdownContent( {
            sourceMarkdown: emptyMarkdown,
            newMarkdown: 'Test',
            markerString: 'upcoming-list',
        } )
    } ).toThrowError( 'upcoming-list' )
} )
