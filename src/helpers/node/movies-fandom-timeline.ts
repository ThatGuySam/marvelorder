import fs from 'fs-extra'
import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'
import { v5 as uuidv5 } from 'uuid'
import slugify from 'slugify'
// Load wink-nlp package  & helpers.
import winkNLP from 'wink-nlp'
// Load "its" helper to extract item properties.
// import its from 'wink-nlp/src/its.js'
// Load english language model — light version.
import winkEngModel from 'wink-eng-lite-model'

import {
    Listing
// @ts-ignore
} from '~/src/helpers/types.ts'

import {
    matchListingTitle,
    cleanListingTitle,
    getListingsByTitleLength,
    cleanExtraWordsFromTitle
// @ts-ignore
} from '~/src/helpers/node/listing-files.ts'


// @ts-ignore
import { storePath } from '~/src/config.ts'

// Instantiate winkNLP.
const nlp = winkNLP( winkEngModel )


export const moviesFandomTimelinePath = `${ storePath }/movies-fandom-timeline.json`

export const timelineUrl = 'https://marvel-movies.fandom.com/wiki/Earth-199999#Timeline'

export const startContentMarker = '<div id="content"'

export const endContentMarker = '<div class="page-footer"'


export async function getEntriesFromJson () {
    const entriesJson = await fs.readJSON( moviesFandomTimelinePath )

    return entriesJson
}


export async function saveMoviesFandomTimeline () {
    const timeline = await fetchTimeline()

    await fs.writeFile( moviesFandomTimelinePath, JSON.stringify( timeline.entries, null, 2 ) )
}

// Fetch build out Timeline structure
export async function fetchTimeline () {
    const timeline = new MarvelMoviesFandomTimeline()

    // Setup
    await timeline.setup()

    return timeline
}

export function getTimelineFromEntries ( entries ) {
    const timeline = new MarvelMoviesFandomTimeline({
        entries
    })

    return timeline
}

export async function getTimelineFromJson () {
    const entries = await getEntriesFromJson()

    return getTimelineFromEntries( entries )
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

const DEFAULT_HASH_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341'

// https://stackoverflow.com/a/67203497/1397641
function hashString ( textContent:string ) {

    // Omit non-alphanumeric characters
    textContent = textContent.replace(/[^a-z0-9]/gi, '')

    return uuidv5( textContent, DEFAULT_HASH_NAMESPACE )
}

// Remove any link brackets from the headings
function cleanBrackets ( heading:string ) {
    return heading.replace( '[]', '' )
}

export function breakEntryTextIntoSentences ( paragraph:string ) {
    // Read text
    const doc = nlp.readDoc( paragraph )
    // Extract sentences from the data
    const sentences = doc.sentences().out()

    return sentences
}

function makeMoviesFandomURLSlug ( string:string ) {
    return slugify( string, {
        lower: true,
        remove: /[^a-zA-Z\d\s\-]/g,
        replacement: '_',
        strict: true
    })
}

function getDetailsFromEpisodeSlug ( slug:string ) {
    // Throw if the word 'episode' is not in the slug
    if ( !slug.includes( 'episode' ) ) {
        throw new Error( `Slug ${ slug } does not contain the word 'episode'` )
    }

    const slugParts = slug.split( '-' )

    const slugObject = {
        show: '',
        season: -1,
        episode: -1
    }

    const slugKeys = Object.keys( slugObject )

    for ( const [ index, slugPart ] of slugParts.entries() ) {
        // If this is one of our slug keys
        // set it
        if ( slugKeys.includes( slugPart ) ) {
            const slugValue = slugParts[ index + 1 ]
            const value = Number( slugValue ) || slugValue
            slugObject[ slugPart ] = value
        }
    }

    return {
        ...slugObject,
        sourceSlug: slug,
    }
}

export interface MarvelMoviesFandomTimelineEntry {
    hash: string
    timeDescription:string
    timeline:string
    sourceUrl:string
    referenceLinks: Array<{
        href:string
        text:string
        referenceType:string
    }>
    timeDescriptionParts: {
        primary:string
        secondary:string
        tertiary:string
    }
    primeReferenceIndex:number
    primeReferenceTitle:string
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

interface MarvelMoviesFandomOptions {
    entries:MarvelMoviesFandomTimelineEntry[]
}

interface JSDOMElement {
    textContent:string
    href:string
    getAttribute ( key:string ):string
}

class MarvelMoviesFandomTimeline {
    constructor ( options = {} as MarvelMoviesFandomOptions ) {

        this.entries = options?.entries || []

        this.runningTimeline = ''
        this.runningTimeParts = {
            primary: '',
            secondary: '',
            tertiary: ''
        }
    }

    hasWordsInReferenceLinks ( words:string[], entry:MarvelMoviesFandomTimelineEntry ) {

        for ( const referenceLink of entry.referenceLinks ) {
            // const linkText = referenceLink.text.toLowerCase()
            const linkHref = referenceLink.href.toLowerCase()

            const hasAllWords = words.every( word => {
                const lowerCaseWord = word.toLowerCase()

                return linkHref.includes( lowerCaseWord )
            } )

            if ( hasAllWords ) {
                return true
            }

        }

        return false
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
            hash: hashString( entry.textContent ),
            ...entry
        } )
    }

    determineReferenceType ( anchorElement ) {
        // If it's (video_game) then it's a video game reference
        if ( anchorElement.href.includes( '(video_game)' ) ) {
            return 'video_game'
        }

        // If it's (comic) then it's a comic reference
        if ( anchorElement.href.includes( '(comic)' ) ) {
            return 'comic'
        }

        const tvKeywords = [
            '(Disney%2B_series)',
            '(TV_series)'
        ]

        const isTvReference = tvKeywords.some( keyword => anchorElement.href.includes( keyword ) )

        // If it's (TV_series) then it's a tv reference
        if ( isTvReference ) {
            return 'tv'
        }

        // If it includes _Episode_ then it's a TV show reference
        if ( anchorElement.href.includes( '_Episode_' ) ) {
            return 'episode'
        }

        return 'unknown'
    }

    extractReferenceLinks ( element ) {
        return Array.from( element.querySelectorAll( 'a' ) ).map( ( anchorElement:JSDOMElement ) => {

            const href = anchorElement.getAttribute( 'href' )
            const text = anchorElement.textContent

            return {
                href,
                text,
                referenceType: this.determineReferenceType( anchorElement )
            }
        })
    }

    determinePrimeReference ( element ) {
        // If there's no paranthesis then it's not a reference
        if ( !element.innerHTML.includes( '<small>(' ) ) {
            return ''
        }

        let workingText = element.innerHTML

        // Split at last index of (
        workingText = workingText.split( '<small>(' ).reverse()[ 0 ]

        // Split at first index of )
        workingText = workingText.split( ')</small>' )[ 0 ]

        const dom = new JSDOM( workingText )

        const [ workingLink ] = dom.window.document.querySelectorAll( 'a' )

        workingText = workingLink?.textContent ? workingLink.textContent : ''

        // If there's paranthesis within the text then remove it
        if ( workingText.includes( '(' ) ) {
            workingText = workingText.split( '(' )[ 0 ]
        }



        return cleanListingTitle( workingText )
    }

    parseListElement ( element ) {

        const listItems = element.querySelectorAll( 'li' )

        for ( const listItem of listItems ) {

            // Skip if it's a list item with no text
            if ( !listItem.textContent ) {
                continue
            }

            // If this list contains a list then it's a tertiary time part
            const childList = listItem.querySelector( 'ul' )
            if ( childList ) {
                const [ part ] = listItem.innerHTML.split( '<ul>' )

                this.runningTimeParts.tertiary = cleanWhiteSpace( part ).replace(/<[^>]*>?/gm, '')

                this.parseListElement( childList )

                continue
            }

            const rawHtml = listItem.innerHTML
            const textContent = (() => {
                if ( !listItem.textContent.includes( '(' ) ) {
                    return listItem.textContent
                }

                return listItem.textContent.substr(0, listItem.textContent.lastIndexOf('('))
            })()
            const referenceLinks = this.extractReferenceLinks( listItem )

            // Use prime referenceLink test as our Prime Reference Title
            const primeReferenceTitle = this.determinePrimeReference( listItem )

            // Use last referenceLink that is not an episode
            const primeReferenceIndex = referenceLinks.findIndex( referenceLink => referenceLink.text === primeReferenceTitle )


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
                // rawHtml,
                textContent,
                timeline: this.runningTimeline,
                sourceUrl: timelineUrl,
                referenceLinks,
                primeReferenceIndex,
                primeReferenceTitle
            })
        }
    }

    parseElement ( element ) {
        const tagName = element.tagName.toLowerCase()
        const textContent = element.textContent.trim()

        if ( tagName === 'h2' ) {
            // Reset the time parts
            // so that our primaries don't
            // bleed into the next timeline
            this.resetTimeParts()

            // Get specific heading text
            // so that we avoid capturing [] after the heading
            const timelineHeading = cleanBrackets( element.textContent )

            this.runningTimeline = timelineHeading

            // Since some of the sections don't have h3s
            // we'll set a default primary here
            // so that we don't end up with a blank primary
            this.runningTimeParts.primary = timelineHeading

            // If it's just 'Timeline' then rename it to 'Marvel Cinematic Universe'
            if ( this.runningTimeline === 'Timeline' ) {
                this.runningTimeline = 'Marvel Cinematic Universe'
            }
        }

        // For h3s start a new time description
        if ( tagName === 'h3' ) {
            // Reset the time parts
            this.resetTimeParts()

            this.runningTimeParts.primary = cleanBrackets( element.textContent )
        }

        // For h4s add to the time description
        if ( tagName === 'h4' ) {
            this.runningTimeParts.secondary = cleanBrackets( element.textContent )
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

    get entriesByReference () {
        const entriesByReference = {}
        let totalEntriesWithReference = 0
        let totalEntriesWithoutReference = 0

        for ( const entry of this.entries ) {
            const { primeReferenceTitle } = entry

            if ( !entriesByReference[ primeReferenceTitle ] ) {
                entriesByReference[ primeReferenceTitle ] = []
            }

            entriesByReference[ primeReferenceTitle ].push( entry )

            primeReferenceTitle.length ? totalEntriesWithReference += 1 : totalEntriesWithoutReference += 1
        }

        return {
            entries: entriesByReference,
            titles: Object.keys( entriesByReference ),
            totalEntriesWithReference,
            totalEntriesWithoutReference
        }
    }

    async getEntriesByListing () {
        const listings = await getListingsByTitleLength()


        return listings.map( listing => {
            const { entries } = this.getEntriesForListing( listing )

            return {
                listing,
                entries
            }
        })
    }

    getEntriesForListing ( listing:Listing ) {

        // Throw for listings without a title
        if ( !listing.title ) {
            throw new Error( 'Listing has no title' )
        }

        const { titles } = this.entriesByReference

        // Sort titles by length
        titles.sort( ( a, b ) => b.length - a.length )

        for ( const title of titles ) {
            // Skip empty titles
            if ( !title.length ) {
                continue
            }

            // Remove the work 'Prelude' from the title
            const titleWithoutPrelude = title.split( 'Prelude' )[ 0 ].trim()

            // console.log({
            //     // listing,
            //     title,
            //     titleWithoutPrelude,
            // })

            if ( titleWithoutPrelude.length && matchListingTitle( titleWithoutPrelude, listing ) ) {
                return {
                    title: titleWithoutPrelude,
                    listingTitle: listing.title,
                    entries: this.entriesByReference.entries[ title ]
                }
            }
        }

        return {
            title: '',
            listingTitle: listing.title,
            entries: []
        }
    }

    async getShowWithEntries ( slug ) {

        const {
            show: showReference,
            season,
            episode
        } = getDetailsFromEpisodeSlug( slug )

        // When show reference is a string
        // then we'll use it as the title
        if ( typeof showReference === 'string' ) {

            const matchingTitle = makeMoviesFandomURLSlug( showReference )

            const matchingEpisode = `episode_${ season }.${ String(episode).padStart( 2, '0') }`

            const matchesShowTitle = entry => this.hasWordsInReferenceLinks( [ matchingTitle, matchingEpisode ], entry )

            return {
                entries: this.entries,
                matchesShow: matchesShowTitle
            }
        }

        // When show reference is an number
        // We'll assume it's a listing ID
        if ( typeof showReference === 'number' ) {

            const listingsAndEntries = await this.getEntriesByListing()

            const { listing, entries } = listingsAndEntries.find( ({ listing }) => listing.id === showReference )

            const slugifiedTitle = makeMoviesFandomURLSlug( listing.title )
            const matchingTitle = cleanExtraWordsFromTitle( slugifiedTitle, '_' ).replace( /_/g, '' )
            const matchingEpisode = `episode_${ season }.${ String(episode).padStart( 2, '0' ) }`

            // const words = [
            //     matchingTitle,
            //     matchingEpisode
            // ]

            const matchesListing = entry => {

                for ( const referenceLink of entry.referenceLinks ) {
                    // const linkText = referenceLink.text.toLowerCase()
                    const linkHref = referenceLink.href.toLowerCase()
                    const slugifiedLinkHref = makeMoviesFandomURLSlug( linkHref ).replace( /_/g, '' )

                    // Use a more generous compare for the listing title
                    // so that we can match longer titles
                    const hasMatchingListingTitle = slugifiedLinkHref.includes( matchingTitle )

                    // if ( linkHref.includes( 'agents' ) ) {
                    //     console.log({
                    //         matchingTitle,
                    //         slugifiedLinkHref,
                    //         hasMatchingListingTitle,

                    //         matchingEpisode,
                    //         linkHref,
                    //         hasMatchingEpisode: linkHref.includes( matchingEpisode )
                    //     })
                    // }

                    if ( !hasMatchingListingTitle ) {
                        continue
                    }

                    const hasMatchingEpisode = linkHref.includes( matchingEpisode )

                    if ( !hasMatchingEpisode ) {
                        continue
                    }

                    return true
                }

                return false
            }

            return {
                entries,
                matchesShow: matchesListing
            }
        }


        throw new Error( 'Invalid show reference' )
    }


    async getEntriesForSlug ( slug ) {

        const {
            matchesShow,
            entries
        } = await this.getShowWithEntries( slug )

        // console.log( 'Starting entry count',  entries.length )

        // console.log({
        //     matchingTitle,
        //     matchingEpisode
        // })

        const matchingEntries = new Map()

        for ( const entry of entries ) {
            // Skip entries without any links
            if ( !entry.referenceLinks.length ) {
                continue
            }

            // Skip entries that we've already matched
            if ( matchingEntries.has( entry.hash ) ) {
                continue
            }

            // Skip entries without expected show title
            if ( !matchesShow( entry ) ) {
                continue
            }


            // Store the entry
            matchingEntries.set( entry.hash, entry )
        }

        // console.log( 'Ending entry count',  matchingEntries.size )

        return Array.from( matchingEntries.values() )
    }
}

