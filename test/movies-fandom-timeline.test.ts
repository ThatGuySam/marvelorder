// https://vitest.dev/api/
import { assert, expect, test, beforeAll } from 'vitest'

import {
    getListingsByTitleLength
// @ts-ignore
} from '~/src/helpers/node/listing-files.ts'

import {
    fetchTimeline,
    getTimelineFromEntries,
    breakEntryTextIntoSentences,
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
    // console.log( 'timeline.entries', timeline.entries )

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

test( 'Can see no html in timeDescriptionParts', () => {
    for ( const entry of timeline.entries ) {
        // console.log( { entry } )
        for ( const partName in entry.timeDescriptionParts ) {
            // Skip empty parts
            if ( entry.timeDescriptionParts[ partName ].length === 0 ) {
                continue
            }

            expect( entry.timeDescriptionParts[ partName ] ).not.toContain( '<' )
            expect( entry.timeDescriptionParts[ partName ] ).not.toContain( '>' )
        }
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


test( 'Can get entries by listing', async () => {
    const listingsAndEntries = await timeline.getEntriesByListing()

    // console.log( { listingsAndEntries } )

    expect( listingsAndEntries.length ).toBeGreaterThan( 0 )

    const first = listingsAndEntries[ 0 ]

    expect( first ).toBeDefined()

    expect( first.listing ).toBeDefined()

    expect( first.entries ).toBeDefined()

    // console.log( 'first.entries', first.entries, first.listing.title )

    expect( first.entries.length ).toBeGreaterThan( 0 )

} )


test( 'Can get episode timeline entries from slug with show name', async () => {
    const slugs = [
        'show-loki-season-1-episode-1',
        'show-wandavision-season-1-episode-2',
        'show-falcon-and-winter-soldier-season-1-episode-6',
        'show-what_if-season-1-episode-9',
        'show-hawkeye-season-1-episode-5',
        'show-moon-knight-season-1-episode-4',
        'show-ms-marvel-season-1-episode-5',
        'show-she-hulk-season-1-episode-5',
    ]

    for ( const slug of slugs ) {
        const entries = await timeline.getEntriesForSlug( slug )

        // console.log({ slug, entries: entries.length })

        expect( entries ).toBeDefined()

        // Expect entries to be an array
        expect( Array.isArray( entries ) ).toBe( true )

        expect( entries.length ).toBeGreaterThan( 0 )

        // Check that there are no duplicate entries using hashes
        const hashes = entries.map( entry => entry.hash )

        expect( hashes.length ).toBe( new Set( hashes ).size )

    }

})


test( 'Can see no "Dawn of Time" for She-Hulk 1.05', async () => {
    const entries = await timeline.getEntriesForSlug( 'show-she-hulk-season-1-episode-5' )

    // console.log({ entries })

    const dawnOfTimeEntries = entries.filter( entry => entry.timeDescription.includes( 'Dawn of Time' ) )

    expect( dawnOfTimeEntries.length ).toBe( 0 )
})



test( 'Can get entries from slug with show ID', async () => {
    const slugs = [
        // She-Hulk 92783
        'show-92783-season-1-episode-5',
        'she-hulk-a-normal-amount-of-rage-recap-show-92783-season-1-episode-5',

        // Loki 84958
        'show-84958-season-1-episode-1',
        'loki-glorious-purpose-recap-show-84958-season-1-episode-1',

        // Agents of S.H.I.E.L.D. 1403
        'show-1403-season-7-episode-1',
        'agents-of-shield-the-new-deal-recap-show-1403-season-7-episode-1',
    ]

    for ( const slug of slugs ) {
        const entries = await timeline.getEntriesForSlug( slug )

        // console.log({ slug, entries: entries.length })

        expect( entries ).toBeDefined()

        // Expect entries to be an array
        expect( Array.isArray( entries ) ).toBe( true )

        expect( entries.length ).toBeGreaterThan( 0 )

        // console.log({
        //     entries: entries.map( entry => entry.timeDescription ),
        //     slug
        // })

        // Check that there are no duplicate entries using hashes
        const hashes = entries.map( entry => entry.hash )

        expect( hashes.length ).toBe( new Set( hashes ).size )

    }
})



const entryMocks = [
    {
        title: 'Eternals',
        input: `The Celestials, titan-like beings ,who wield massive cosmic power, led by Arishem, who first created planets, suns and life-forms throughout the cosmos. In order to create more Celestials who continue to create life in the Universe, seeded planets with nascent Celestials. As the Emergence of a new Celestial required the presence of a large population of sentient beings on the world they were seeded into, the Celestials genetically engineered the Deviants to wipe out the planet's apex predators.`,
        output: [
            `The Celestials, titan-like beings ,who wield massive cosmic power, led by Arishem, who first created planets, suns and life-forms throughout the cosmos.`,
            `In order to create more Celestials who continue to create life in the Universe, seeded planets with nascent Celestials.`,
            `As the Emergence of a new Celestial required the presence of a large population of sentient beings on the world they were seeded into, the Celestials genetically engineered the Deviants to wipe out the planet's apex predators.`,
        ]
    },
    {
        title: 'SHIELD 1',
        input: `The leaders of S.H.I.E.L.D. send an agent to Berlin and stop the radicals from reverse-engineering the HYDRA technology.`,
        output: [
            'The leaders of S.H.I.E.L.D. send an agent to Berlin and stop the radicals from reverse-engineering the HYDRA technology.'
        ]
    },
    {
        title: 'Mr. X',
        input: `Fury orders Agent Coulson to recruit Mr. Hendricks to S.H.I.E.L.D. `,
        output: [
            'Fury orders Agent Coulson to recruit Mr. Hendricks to S.H.I.E.L.D.'
        ]
    }
]




test( 'Can break entry text content into sentences', () => {
    for ( const entryMock of entryMocks ) {
        const { input, output } = entryMock

        const sentences = breakEntryTextIntoSentences( input )

        // Sentence should be an array
        expect( Array.isArray( sentences ) ).toBe( true )

        for ( const [ index, sentence ] of sentences.entries() ) {
            // Sentence should be a string
            expect( typeof sentence ).toBe( 'string' )

            expect( sentence ).toEqual( output[index] )
        }

        // console.log({ title, input, output, sentences })

        // expect( sentences ).toEqual( output )
    }
})


