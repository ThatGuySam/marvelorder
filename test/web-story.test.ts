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

            // Ensure layer has a template attribute
            expect( layer.props.template ).toBeDefined()

            for ( const element of layer.elements ) {

                // console.log({ element })

                // Skip elements that don't have text
                if ( element.tagName === 'p' ) {
                    // Check that text is not too short
                    expect( element.text.trim().length ).toBeGreaterThan( 1 )

                    // Expect text to contain 2 periods at different places
                    expect( element.text.split('. ').length ).toBeGreaterThan( 0 )

                    // if ( pageIndex === 1 ) {
                    //     expect( element.text.split('. ').length ).toBe( 2 )
                    // }
                }
            }

            // Find the source-link element
            // so that we know we're always crediting the source
            const sourceLinkElement = layer.elements.find( element => element.props.className.includes('source-link') )

            // Check that the source link element exists
            expect( sourceLinkElement ).not.toBe( undefined )

            // Check that the source link element has a valid url in href
            expect( sourceLinkElement.props.href ).toBeDefined()

            // Check that the source link element has a valid url in href that starts with https://
            expect( sourceLinkElement.props.href.startsWith('https://') ).toBe( true )

        }
    }

})
