// https://vitest.dev/api/
import { assert, expect, test, beforeAll } from 'vitest'

// @ts-ignore
import { getTimeline } from '~/src/helpers/node/movies-fandom-timeline.ts'


let timeline

beforeAll(async () => {
    timeline = await getTimeline()
})

test('Can get timeline entries', async () => {

    expect( timeline.entries ).toBeDefined()
    expect( timeline.entries.length ).toBeGreaterThan( 0 )
})

test('Can get timeline entry from entries', () => {
    const firstEntry = timeline.entries[ 0 ]

    expect( firstEntry ).toBeDefined()

})
