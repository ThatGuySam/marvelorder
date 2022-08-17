import 'dotenv/config'
import axios from 'axios'

import {
    getYearAndMonth,
    makeSlug
// @ts-ignore
} from '~/src/helpers/node/listing.ts'

import {
    getAllListings
// @ts-ignore
} from '~/src/helpers/node/listing-files.ts'

import {
    FilteredListings,
    isDoc,
    isMarvelKnightsAnimated
// @ts-ignore
} from '~/src/helpers/listing-filters.ts'



const inUniverseFirstPage = '/CuratedSet/version/5.1/region/US/audience/k-false,l-true/maturity/1450/language/en/setId/9466a148-f6b4-4c1a-8028-b0129323f4a9/pageSize/15/page/1'


function mapCuratedSetItem ( item:any ) {
    const isSeries = !!item?.seriesType
    const programOrSeries = isSeries ? 'series' : 'program'
    const titleObject = item.text.title

    return {
        contentId: item.contentId,
        title: titleObject.full[ programOrSeries ].default.content,
        slug: titleObject.slug[ programOrSeries ].default.content,
        releases: item.releases,
        seriesType: item?.seriesType,
        type: isSeries ? 'series' : item.programType,
    }
}

export async function getInUniverseTimeline () {
    // console.log( 'DISNEY_API_PREFIX', process.env.DISNEY_API_PREFIX )

    let pageTotal = Infinity
    let pageIndex = 1

    const allItems = []

    while ( pageTotal > 0 ) {
        const pageUrl = `${ process.env.DISNEY_API_PREFIX }${ inUniverseFirstPage.replace( '/page/1', `/page/${ pageIndex }` ) }`
        const page = await axios( pageUrl ).then( res => res.data )

        const items = page.data.CuratedSet.items.map( mapCuratedSetItem )

        allItems.push( ...items )

        pageTotal = items.length
        pageIndex++
    }

    return allItems
}

export function matchListingToInUniverse ( listing, inUniverseEntry ) {

    // Skip if listing has no release date
    if ( !listing.dateString ) {
        return false
    }

    // console.log( 'listing.dateString', listing.dateString )
    // console.log( 'inUniverseEntry.releases[0].releaseDate', inUniverseEntry.releases[0].releaseDate )
    const dateMatches = getYearAndMonth( inUniverseEntry.releases[0].releaseDate ) === getYearAndMonth( listing.dateString )

    if ( !dateMatches ) return false


    const listingSlug = makeSlug( listing.title ).replace( 'marvel-one-shot', '' )
    const inUniverseSlug = makeSlug( inUniverseEntry.title )

    // console.log( 'listingSlug', listingSlug )
    // console.log( 'orderedSlug', inUniverseSlug )

    // We can be a bit more generous with the slug matching
    // since the listing are all in the same month and year
    return inUniverseSlug.includes( listingSlug ) || listingSlug.includes( inUniverseSlug )
}

export function matchTimelineEntryToSavedListing ( inUniverseEntry:any, savedListings:any[] ) {
    for ( const savedListing of savedListings ) {
        if ( matchListingToInUniverse( savedListing, inUniverseEntry ) ) {
            return savedListing
        }
    }

    throw new Error( `Could not match timeline entry to saved listing: ${ inUniverseEntry.title }` )
}


const inUniverseFilters = new Map([
    [
        isDoc,
        {
            targetValue: false
        }
    ],
    [
        isMarvelKnightsAnimated,
        {
            targetValue: false
        }
    ]
])

async function getInUniverseListigns () {
    const rawListings = await getAllListings()

    const inUniverseListings = new FilteredListings({
        listings: rawListings,
        initialFilters: inUniverseFilters,
        useDefaultFilters: false,
        listingsSort: 'default'
    })

    return inUniverseListings.list
}

export async function getInUniverseTimelineAndListings () {
    const universeTimeline = await getInUniverseTimeline()
    const savedListings = await getInUniverseListigns()

    const matches = new Map()

    for ( const inUniverseEntry of universeTimeline ) {
        const matchingListing = matchTimelineEntryToSavedListing( inUniverseEntry, savedListings )

        matches.set( matchingListing.id, {
            inUniverseEntry,
            mappedListing: matchingListing,
        })
    }

    return Array.from( matches.values() )
}
