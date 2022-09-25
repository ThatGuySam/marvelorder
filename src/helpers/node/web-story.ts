import {
    WebStory,
    WebStoryPage,
// @ts-ignore
} from '~/src/helpers/types.ts'

// @ts-ignore
import { trimCharacter } from '~/src/helpers/string.ts'

import {
    MarvelMoviesFandomTimelineEntry
// @ts-ignore
} from '~/src/helpers/marvel-movies-timeline.ts'


function breakEveryNthSentence ( paragraph:string, n:number = 1 ) {
    const separator = '. '

    // If there are no periods, just return the paragraph
    if ( !paragraph.includes( separator ) ) return [ paragraph ]

    const sentences = paragraph.split( separator )

    let runningSegment = ''

    const segments = []

    for ( let i = 0; i < sentences.length; i++ ) {
        const sentence = sentences[ i ]

        const cleanSentence = trimCharacter( sentence.trim() , '.' )

        runningSegment += cleanSentence + separator

        if ( i % n !== 0 ) {
            segments.push( runningSegment )
            runningSegment = ''
        }
    }

    return segments
}

function buildWebStoryPagesFromTimelineEntry ( timelineEntry:MarvelMoviesFandomTimelineEntry ) {
    const pagesFromEntry = []

    // console.log( 'timelineEntry.textContent', timelineEntry.textContent )

    const textContentSegments = breakEveryNthSentence( timelineEntry.textContent, 2 )

    // console.log( 'textContentSegments', textContentSegments )

    for ( const segment of textContentSegments ) {

        const page:WebStoryPage = {
            id: `page-${ timelineEntry.hash }`,
            backgroundSrc: '',
            backgroundPoster: '',
            mediaAriaLabel: '',
            layers: [
                {
                    template: 'vertical',
                    props: {
                        className: 'page-layer-1 content-end gap-6'
                    },
                    elements: [
                        // Logo
                        // {
                        //     src: 'https://vumbnail.com/G3-UkHQLTtw.jpg',
                        //     width: 100,
                        //     height: 100,
                        //     layout: 'fixed',
                        //     className: 'logo'
                        // },
                        // // Time description
                        // {
                        //     text: timelineEntry.timeDescription,
                        //     tagName: 'small',
                        //     className: 'time-description'
                        // },

                        // Text content
                        {
                            text: segment,
                            tagName: 'p',
                            props: {
                                className: 'text-content font-bold bg-black/10 backdrop-blur-xl p-4 inline'
                            }
                        },
                        // Source link
                        {
                            text: 'From Marvel Movies Fandom',
                            tagName: 'a',
                            props: {
                                href: timelineEntry.sourceUrl,
                                className: 'source-link opacity-50 underline text-xs'
                            }
                        }
                    ]// End Elements
                }
            ]// End Layers

        }// End Page

        pagesFromEntry.push( page )
    }

    return pagesFromEntry
}


export function buildWebStoryFromTimelineEntries ( timelineEntries:Array<MarvelMoviesFandomTimelineEntry> ) {
    const pages = []

    for ( const entry of timelineEntries ) {
        const pagesFromEntry = buildWebStoryPagesFromTimelineEntry( entry )
        pages.push( ...pagesFromEntry )
    }

    return {
        pages
    }
}


// export function buildWebStoryFromListings
