import { JSDOM } from 'jsdom'


export const timelineUrl = 'https://marvel-movies.fandom.com/wiki/Earth-199999#Timeline'


export const startContentMarker = '<div id="content"'

export const endContentMarker = '<div class="page-footer"'


// Fetch build out Timeline structure
export async function getTimeline () {
    const timeline = new MarvelMoviesFandomTimeline()

    // Setup
    await timeline.setup()

    return timeline
}

interface MarvelMoviesFandomTimelineEntry {
    title:string
    timeline:string
}

interface MarvelMoviesFandomTimeline {
    entries:MarvelMoviesFandomTimelineEntry[]
}

class MarvelMoviesFandomTimeline {
    constructor () {
        this.entries = []
    }

    async fetchFandomPage () {
        const response = await fetch( timelineUrl )
        return await response.text()
    }

    async getTimelineHTML () {
        const pageHTML = await this.fetchFandomPage()

        const startIndex = pageHTML.indexOf( startContentMarker )
        const endIndex = pageHTML.indexOf( endContentMarker )

        return pageHTML.substring( startIndex, endIndex )
    }

    async parseTimelineHTML () {
        const elementSelector = '.mw-parser-output > *'
        const entries = []

        const html = await this.getTimelineHTML()

        const dom = new JSDOM( html )

        const elements = dom.window.document.querySelectorAll( elementSelector )

        let currentTimeline = ''

        for ( const element of elements ) {
            const tagName = element.tagName.toLowerCase()

            if ( tagName === 'h2' ) currentTimeline = element.textContent

            if ( tagName === 'ul' ) {
                const listItems = element.querySelectorAll( 'li' )

                for ( const listItem of listItems ) {
                    const rawHtml = listItem.innerHTML

                    entries.push({
                        title: 'test',
                        rawHtml,
                        timeline: currentTimeline,
                    })
                }
            }
        }

        return entries
    }

    async setup () {
        this.entries = await this.parseTimelineHTML()

        console.log( 'this.entries', this.entries )
    }
}
