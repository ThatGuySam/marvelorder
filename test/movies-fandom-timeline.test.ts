// https://vitest.dev/api/
import { assert, expect, test, beforeAll } from 'vitest'

import {
    getListingsByTitleLength
// @ts-ignore
} from '~/src/helpers/node/listing-files.ts'

import {
    fetchTimeline,
    getTimelineFromEntries
// @ts-ignore
} from '~/src/helpers/node/movies-fandom-timeline.ts'


let timeline

beforeAll(async () => {
    const timelineFromFetch = await fetchTimeline()

    // Convert the fetched entries to JSON and then back again
    const entriesFromJson = JSON.parse( JSON.stringify( timelineFromFetch.entries ) )

    // Take the fetched entries and load them in via the constructor
    // so that we know that it can be built from JSON
    timeline = getTimelineFromEntries( entriesFromJson )
})

test( 'Can get timeline entries', async () => {

    expect( timeline.entries ).toBeDefined()
    expect( timeline.entries.length ).toBeGreaterThan( 0 )

    const firstEntry = timeline.entries[ 0 ]

    // Has source url
    expect( firstEntry.sourceUrl ).toBeDefined()

    // Has reference link
    expect( firstEntry.referenceLinks ).toBeDefined()
    expect( firstEntry.referenceLinks.length ).toBeGreaterThan( 0 )
    expect( firstEntry.referenceLinks[ 0 ].href ).toBeDefined()
    expect( firstEntry.referenceLinks[ 0 ].text ).toBeDefined()
})

test( 'Can get timeline entry from entries', () => {
    const firstEntry = timeline.entries[ 0 ]

    expect( firstEntry ).toBeDefined()
})

test( 'Can find Altered 2014 Timeline', () => {
    const altered2014Timeline = timeline.entries.find( entry => entry.timeline === 'Altered 2014 Timeline' )

    expect( altered2014Timeline ).toBeDefined()
} )

test( 'Can find March 12th, 2015', () => {
    const march12th2015 = timeline.entries.find( entry => entry.timeDescription === '2015 March 12th' )

    expect( march12th2015 ).toBeDefined()
})

test( `Can find Prime reference link in entries`, () => {
    for ( const entry of timeline.entries ) {
        expect( entry.primeReferenceIndex ).toBeDefined()

        expect( entry.primeReferenceTitle ).toBeDefined()

        // Expect that the prime reference title has no commas
        expect( entry.primeReferenceTitle ).not.toContain( ',' )

        // Expect that the prime reference title has no quotes
        expect( entry.primeReferenceTitle ).not.toContain( '"' )
    }
})

test( 'Can see expected entry structure', () => {
    const { titles, totalEntriesWithReference } = timeline.entriesByReference

    // console.log( { titles } )

    // Expect at least 871 entries with references
    expect( totalEntriesWithReference ).toBeGreaterThan( 870 )

    // Expect Agent Carter
    expect( titles ).toContain( 'Agent Carter' )

    // Expect to not see Agent Carter The Blitzkrieg Button
    expect( titles ).not.toContain( 'Agent Carter The Blitzkrieg Button' )

    expect( titles ).toContain( 'Agents of S.H.I.E.L.D.' )

    expect( titles ).not.toContain( 'Marvel\'s Agents of S.H.I.E.L.D.' )
})

test( 'Can match entry references to listings', async () => {
    const listings = await getListingsByTitleLength()

    const { titles, totalEntriesWithReference } = timeline.entriesByReference

    // Setup a map of titles to listings using the title as the key
    const listingsByTitle = titles.reduce( ( map, title ) => {
        map[ title ] = null

        return map
    }, {} )

    for ( const listing of listings ) {
        const { title, entries } = timeline.getEntriesForListing( listing )

        // console.log( 'entries', listing.title, entries.length )

        if ( entries.length > 0 ) {
            listingsByTitle[ title ] = timeline.getEntriesForListing( listing )
        }
    }

    // console.log( { listingsByTitle } )

    expect( listingsByTitle[ 'Marvel\'s Agents of S.H.I.E.L.D.' ] ).not.toBeDefined()

    expect( listingsByTitle[ 'Agent Carter' ] ).toBeDefined()

    const thorTwoEntries = listingsByTitle[ 'Thor: The Dark World' ].entries
    // Thor: The Dark World includes Prelude comic references
    const thorPreludeEntries = thorTwoEntries.filter( entry => entry.primeReferenceTitle.includes( 'Prelude' ) )

    expect( thorPreludeEntries.length ).toBeGreaterThan( 0 )

} )


test( 'Can see Lamentis episodes in all 2077 Loki references', () => {
    const { entries } = timeline.entriesByReference

    // console.log( { entries } )

    const lokiEntries = entries[ 'Loki' ]

    const loki2077Entries = lokiEntries.filter( entry => entry.timeDescription.includes( '2077' ) )

    for ( const entry of loki2077Entries ) {
        // 'Lamentis', 'The Nexus Event'
        // const isEitherLamentisEpisode = ([ 'Lamentis', 'The Nexus Event' ]).some( title => entry.textContent.includes( title ) )

        expect( entry ).toEqual(
            expect.objectContaining({
                // Check in Reference links
                referenceLinks: expect.arrayContaining([
                    expect.objectContaining({
                        text: expect.stringMatching( /Lamentis|The Nexus Event/ )
                    })
                ])
            })
        )
    }
} )


