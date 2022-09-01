// https://vitest.dev/api/
import { assert, expect, test, beforeAll } from 'vitest'

// @ts-ignore
import { getTimeline } from '~/src/helpers/node/movies-fandom-timeline.ts'


let timeline

beforeAll(async () => {
    timeline = await getTimeline()
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

    // console.log( 'titles', titles )

    // Expect at least 75 entries with references
    expect( totalEntriesWithReference ).toBeGreaterThan( 74 )

    // Expect Agent Carter
    expect( titles ).toContain( 'Agent Carter' )

    // Expect to not see Agent Carter The Blitzkrieg Button
    expect( titles ).not.toContain( 'Agent Carter The Blitzkrieg Button' )
})


