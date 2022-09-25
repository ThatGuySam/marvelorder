// https://vitest.dev/api/
import { assert, expect, test, beforeAll } from 'vitest'

import {
    getTimelineFromJson
// @ts-ignore
} from '~/src/helpers/node/movies-fandom-timeline.ts'

import {
    buildWebStoryFromTimelineEntries
// @ts-ignore
} from '~/src/helpers/node/web-story.ts'


let timeline

beforeAll(async () => {
    // Take the fetched entries and load them in via the constructor
    // so that we know that it can be built from JSON
    timeline = await getTimelineFromJson()
})

test( 'Can get web story pages from timeline entries', async () => {

    const webStory = buildWebStoryFromTimelineEntries( timeline.entries )

    expect(webStory.pages.length).not.toBe( 0 )

    for ( const page of webStory.pages ) {
        for ( const [ pageIndex, layer ] of page.layers.entries() ) {
            for ( const element of layer.elements ) {
                // Skip elements that don't have text
                if ( !element.text ) continue

                // console.log( 'element.text', element.text )

                // console.log({ pageIndex, pageCount })

                // Check that text is not too short
                expect( element.text.length ).toBeGreaterThan( 1 )

                // Expect text to contain 2 periods at different places
                expect( element.text.split('. ').length ).toBeGreaterThan( 0 )

                if ( pageIndex === 1 ) {
                    expect( element.text.split('. ').length ).toBe( 3 )
                }
            }
        }
    }

})
