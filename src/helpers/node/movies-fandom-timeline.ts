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

function* idMaker () {
    let index = 0;
    while (true) {
        yield index++;
    }
}

function cleanWhiteSpace ( string ) {
    return string.replace(/(\r\n|\n|\r)/gm, ' ').trim()
}
interface MarvelMoviesFandomTimelineEntry {
    timeDescription:string
    timeline:string
    sourceUrl:string
    timeDescriptionParts: {
        primary: string
        secondary: string
        tertiary: string
    }
}

interface MarvelMoviesFandomTimeline {
    entries:MarvelMoviesFandomTimelineEntry[]
    runningTimeline:string
    runningTimeParts: {
        primary:string
        secondary:string
        tertiary:string
    }
}

interface JSDOMElement {
    textContent:string
    href:string
    getAttribute ( key:string ):string
}

class MarvelMoviesFandomTimeline {
    constructor () {
        this.entries = []

        this.runningTimeline = ''
        this.runningTimeParts = {
            primary: '',
            secondary: '',
            tertiary: ''
        }
    }

    get runningTimeDescription () {
        return Object.values( this.runningTimeParts ).filter( part => part.length ).join( ' ' )
    }

    resetTimeParts () {
        for ( const key in this.runningTimeParts ) {
            this.runningTimeParts[ key ] = ''
        }
    }

    entryCountGenerator = idMaker()

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

    storeEntry ( entry ) {
        this.entries.push( {
            timelineOrder: this.entryCountGenerator.next().value,
            ...entry
        } )
    }

    parseListElement ( element ) {

        const listItems = element.querySelectorAll( 'li' )

        for ( const listItem of listItems ) {
            // If this list contains a list then it's a tertiary time part
            const childList = listItem.querySelector( 'ul' )
            if ( childList ) {
                const [ part ] = listItem.innerHTML.split( '<ul>' )

                this.runningTimeParts.tertiary = cleanWhiteSpace( part )

                this.parseListElement( childList )

                continue
            }

            const rawHtml = listItem.innerHTML
            // const referenceLinks = this.extractReferenceLinks( listItem )

            // if ( !textContent.replace(/(\r\n|\n|\r)/gm, '').endsWith(')') ) {
            //     console.log( 'textContent', textContent.length, { textContent } )
            //     // throw new Error( 'Raw HTML ends with )' )
            // }

            // if ( this.runningTimeParts.tertiary.length ) {
            //     console.log( 'this.runningTimeDescription', this.runningTimeDescription )
            //     // throw new Error( 'Raw HTML ends with )' )
            // }

            this.storeEntry({
                timeDescription: this.runningTimeDescription,
                timeDescriptionParts: { ...this.runningTimeParts },
                rawHtml,
                timeline: this.runningTimeline,
                sourceUrl: timelineUrl,
                // referenceLinks
            })
        }
    }

    parseElement ( element ) {
        const tagName = element.tagName.toLowerCase()
        const textContent = element.textContent.trim()

        if ( tagName === 'h2' ) {
            this.runningTimeline = element.textContent
        }

        // For h3s start a new time description
        if ( tagName === 'h3' ) {
            // Reset the time parts
            this.resetTimeParts()

            this.runningTimeParts.primary = element.textContent
        }

        // For h4s add to the time description
        if ( tagName === 'h4' ) {
            this.runningTimeParts.secondary = element.textContent
        }

        if ( tagName === 'ul' ) {
            this.parseListElement( element )
        }
    }

    async parseTimelineHTML () {
        const elementSelector = '.mw-parser-output > *'

        const html = await this.getTimelineHTML()

        const dom = new JSDOM( html )

        const elements = dom.window.document.querySelectorAll( elementSelector )

        for ( const element of elements ) {
            // Break at 'Characters' section
            if ( element.textContent === 'Characters' ) {
                break
            }

            this.parseElement( element )
        }
    }

    async setup () {

        await this.parseTimelineHTML()

        // console.log( 'this.entries', this.entries.filter( entry => {
        //     return entry.timeDescriptionParts.tertiary.length
        // }) )
    }
}
