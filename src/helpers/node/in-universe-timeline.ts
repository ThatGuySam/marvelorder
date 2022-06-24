import 'dotenv/config'
import axios from 'axios'

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