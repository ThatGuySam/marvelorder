import type { Listing } from '~/src/helpers/types.ts'

type ListingDateField = 'first_air_date' | 'release_date'

interface AuthoritativeReleaseDateOverride {
    dateField: ListingDateField
    sourceUrl: string
    value: string
    verifiedAt: string
}

const authoritativeReleaseDateById = new Map<number, AuthoritativeReleaseDateOverride>( [
    [
        969681,
        {
            dateField: 'release_date',
            sourceUrl: 'https://www.sony.com/en/SonyInfo/IR/library/presen/er/pdf/24q3_sonyspeech.pdf',
            value: '2026-07-31',
            verifiedAt: '2026-03-12',
        },
    ],
    [
        911916,
        {
            dateField: 'release_date',
            sourceUrl: 'https://www.sony.com/en/SonyInfo/IR/library/presen/er/pdf/24q3_sonyspeech.pdf',
            value: '2027-06-18',
            verifiedAt: '2026-03-12',
        },
    ],
] )

function isMeaningfulString ( value: unknown ): value is string {
    return typeof value === 'string' && value.trim().length > 0
}

export function getAuthoritativeReleaseDateOverride ( listing: Pick<Listing, 'id'> ) {
    if ( typeof listing.id !== 'number' ) {
        return null
    }

    return authoritativeReleaseDateById.get( listing.id ) || null
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
