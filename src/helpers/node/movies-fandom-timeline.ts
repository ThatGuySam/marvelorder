

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

    async setup () {
        this.entries.push( {
            title: 'test',
            timeline: 'mcu-prime'
        } )
    }
}
