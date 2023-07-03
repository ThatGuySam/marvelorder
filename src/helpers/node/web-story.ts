import {
    WebStoryPage,
// @ts-ignore
} from '~/src/helpers/types.ts'

import {
    MarvelMoviesFandomTimelineEntry,
    breakEntryTextIntoSentences
// @ts-ignore
} from '~/src/helpers/node/movies-fandom-timeline.ts'


// https://stackoverflow.com/a/55435856/1397641
function* chunk ( arr:Array<any>, n:number, characterLimit:number = Infinity ) {
    for (let i = 0; i < arr.length;) {
        // If the the next chunk is too long
        // then let it be by itself
        if ( arr[ i ].length > characterLimit ) {
            yield [ arr[ i ] ]
            i += 1
            continue
        }

        yield arr.slice(i, i + n)
        i += n
    }
}

function buildWebStoryPagesFromTimelineEntry ( timelineEntry: MarvelMoviesFandomTimelineEntry ) {
    const pagesFromEntry = []

    // console.log( 'timelineEntry.textContent', timelineEntry.textContent )

    const sentences = breakEntryTextIntoSentences( timelineEntry.textContent, 2 )

    const sentencesChunks = chunk( sentences, 2, 120 )

    // console.log( 'textContentSegments', textContentSegments )

    for ( const group of sentencesChunks ) {

        const page:WebStoryPage = {
            id: `page-${ timelineEntry.hash }`,
            backgroundSrc: '',
            backgroundPoster: '',
            mediaAriaLabel: '',
            layers: [
                {
                    props: {
                        template: 'vertical',
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

                        ...group.map( ( sentence, index ) => {
                            return {
                                text: sentence,
                                tagName: 'p',
                                props: {
                                    className: [
                                        'text-content text-lg w-64 bg-black/25 backdrop-blur-xl backdrop-saturate-200 inline whitespace-pre-line p-4',
                                        index % 2 === 0 ? '' : 'ml-auto'
                                    ].join(' ')
                                }
                            }
                        }),

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
