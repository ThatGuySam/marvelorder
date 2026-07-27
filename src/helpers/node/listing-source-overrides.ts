import type { Listing } from '~/src/helpers/types.ts'

type ListingDateField = 'first_air_date' | 'release_date'

interface AuthoritativeReleaseDateOverride {
    dateField: ListingDateField
    sourceUrl: string
    value: string
    verifiedAt: string
    titleIncludes?: string
    titleEquals?: string
}

const authoritativeReleaseDateOverrides: Array<AuthoritativeReleaseDateOverride & { id: number }> = [
    {
        id: 969681,
        dateField: 'release_date',
        sourceUrl: 'https://www.sony.com/en/SonyInfo/IR/library/presen/er/pdf/24q3_sonyspeech.pdf',
        value: '2026-07-31',
        verifiedAt: '2026-03-12',
    },
    {
        id: 911916,
        dateField: 'release_date',
        sourceUrl: 'https://www.sony.com/en/SonyInfo/IR/library/presen/er/pdf/24q3_sonyspeech.pdf',
        value: '2027-06-18',
        verifiedAt: '2026-03-12',
    },
    {
        id: 1003596,
        dateField: 'release_date',
        sourceUrl: 'https://www.marvel.com/movies/avengers-doomsday',
        value: '2026-12-18',
        verifiedAt: '2026-07-27',
        titleIncludes: 'avengers doomsday',
    },
    {
        id: 1003598,
        dateField: 'release_date',
        sourceUrl: 'https://www.marvel.com/movies/avengers-secret-wars',
        value: '2027-12-17',
        verifiedAt: '2026-07-27',
    },
    {
        id: 1386618,
        dateField: 'release_date',
        sourceUrl: 'https://thewaltdisneycompany.com/news/marvel-studios-comic-con-2026/',
        value: '2028-12-15',
        verifiedAt: '2026-07-27',
        titleEquals: 'black panther 3',
    },
    {
        id: 1037199,
        dateField: 'release_date',
        sourceUrl: 'https://thewaltdisneycompany.com/news/marvel-studios-comic-con-2026/',
        value: '2028-12-15',
        verifiedAt: '2026-07-27',
        titleEquals: 'black panther 3',
    },
    {
        id: 1738010,
        dateField: 'release_date',
        sourceUrl: 'https://thewaltdisneycompany.com/news/marvel-studios-comic-con-2026/',
        value: '2028',
        verifiedAt: '2026-07-27',
        titleIncludes: 'ghost rider',
    },
    {
        id: 213375,
        dateField: 'first_air_date',
        sourceUrl: 'https://www.marvel.com/articles/tv-shows/marvel-television-visionquest-release-date?pubDate=20260513',
        value: '2026-10-14',
        verifiedAt: '2026-07-27',
        titleIncludes: 'visionquest',
    },
]

function isMeaningfulString ( value: unknown ): value is string {
    return typeof value === 'string' && value.trim().length > 0
}

export function getAuthoritativeReleaseDateOverride ( listing: Pick<Listing, 'id'> & Partial<Pick<Listing, 'title'>> ) {
    if ( typeof listing.id !== 'number' ) {
        return null
    }

    const normalizedTitle = typeof listing.title === 'string'
        ? listing.title.toLowerCase().replace( /[^a-z0-9]+/g, ' ' ).trim()
        : ''

    return authoritativeReleaseDateOverrides.find( ( override ) => {
        if ( override.id !== listing.id ) {
            return false
        }

        if ( !override.titleIncludes ) {
            if ( !override.titleEquals ) {
                return true
            }

            return normalizedTitle === override.titleEquals
        }

        return normalizedTitle.includes( override.titleIncludes )
    } ) || null
}

export function normalizeListingObservation (
    listing: Listing,
    tmdbListing: Partial<Listing> = {},
) {
    const normalizedListing: Listing = {
        ...listing,
    }

    if ( normalizedListing.release_date === '' && isMeaningfulString( tmdbListing.release_date ) ) {
        normalizedListing.release_date = tmdbListing.release_date
    }

    if ( normalizedListing.first_air_date === '' && isMeaningfulString( tmdbListing.first_air_date ) ) {
        normalizedListing.first_air_date = tmdbListing.first_air_date
    }

    const releaseDateOverride = getAuthoritativeReleaseDateOverride( normalizedListing )

    if ( releaseDateOverride ) {
        normalizedListing[ releaseDateOverride.dateField ] = releaseDateOverride.value
    }

    return normalizedListing
}
