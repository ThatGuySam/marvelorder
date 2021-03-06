export interface Listing {
    // Doubles as disable since it's used by Astro
    // https://docs.astro.build/en/guides/markdown-content/#markdown-drafts
    draft?: boolean
    title: string
    name?: string
    sourceListing?: Listing
    overview: string
    backdrop_path: string,
    backdrop: Function,
    genre_ids: Array<number>
    id: number
    origin_country: Array<string>
    original_language: string
    original_title?: string
    popularity: number
    poster_path: string
    release_date?: string
    first_air_date?: string
    vote_average: number
    vote_count: number
    type: string
    logo_on_black?: string
    slug: string
    companies: Array<{
        id: number
        name: string
    }>
    mcuTimelineOrder?: number



    // "origin_country": [
    //     "US"
    // ],
    // "original_language": "en",
    // "original_name": "Agatha: House of Harkness",
    // "overview": "Follows Agatha Harkness before her appearance in WandaVision.",
    // "popularity": 2.419,
    // "poster_path": "/akjfAgmQ6KEP5exgJ2DLyyom9Eq.jpg",
    // "vote_average": 0,
    // "vote_count": 0,
    // "title": "Agatha: House of Harkness",
    // "slug": "agatha-house-of-harkness",
    // "type": "tv",
    // "companies": [
    //     {
    //         "name": "Marvel Studios",
    //         "id": "420"
    //     }
    // ]
}
