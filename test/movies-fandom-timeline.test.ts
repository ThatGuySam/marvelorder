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
