import { assert, expect, test } from 'vitest'

// @ts-ignore
import { getAllListings } from '~/src/helpers/node/listing-files.ts'
import { 
    makeUpcomingListingsMarkdown
// @ts-ignore
} from '~/src/helpers/node/readme.ts'
import { 
    isUpcoming, 
    FilteredListings
// @ts-ignore
} from '~/src/helpers/listing-filters.ts'



const testMarkdown = `
<!-- start-upcoming-list -->

- 05-2021 - [Old Listing](https://marvelorder.com/) - 🎬 Marvel Studios - [Edit](https://github.com/ThatGuySam/marvelorder/blob/main/src/pages/en/doctor-strange-in-the-multiverse-of-madness-453395.md)
- 06-2021 - [Another Old Listing](https://marvelorder.com/) - 🏰 Disney+ - [Edit](https://github.com/ThatGuySam/marvelorder/blob/main/src/pages/en/ms-marvel-92782.md)

<!-- end-upcoming-list -->
`

test('Can generate upcoming Listing Markdown', async () => {

    const rawListings = await getAllListings()
    // Filter listings
    const upcomingListings = new FilteredListings({
        listings: rawListings,
        initialFilters: [
            [ isUpcoming, true ]
        ],
        listingsSort: 'default'
    })

    const [ nextUpcomingListing ] = upcomingListings.list

    // Expect first mark to have a date of this current month or in the future
    expect( Number( nextUpcomingListing.date ) ).toBeGreaterThan( Date.now() )

    // Generate markdown
    const upcomingMarkdown = makeUpcomingListingsMarkdown( upcomingListings.list )

    // console.log( 'upcomingMarkdown', upcomingMarkdown )

    // Expect upcomingMarkdown to not contain 'Old Listing'
    expect( upcomingMarkdown ).not.toContain( 'Old Listing' )
})