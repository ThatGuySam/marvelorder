import {
    FANART_IMAGE_PATH,
    IMAGE_WORKER_ORIGIN,
    NETLIFY_TMDB_IMAGE_PATH,
    NETLIFY_FANART_IMAGE_PATH,
    TMDB_IMAGE_PATH,
} from '../config.ts'

export const TMDB_IMAGE_PATH_PLACEHOLDER = '{tmdb-path}' as const

export const FANART_IMAGE_PATH_PLACEHOLDER = '{fanart-path}' as const

type ImagePathReplacement = readonly [ string, string ]

const defaultImagePathPlaceholders: ReadonlyArray<ImagePathReplacement> = [
    [ TMDB_IMAGE_PATH_PLACEHOLDER, TMDB_IMAGE_PATH ],
    [ FANART_IMAGE_PATH_PLACEHOLDER, FANART_IMAGE_PATH ],
]

function isPlainObject ( value: unknown ): value is Record<string, unknown> {
    return Object.prototype.toString.call( value ) === '[object Object]'
}

function replaceImagePathSegments ( value: string, replacements: ReadonlyArray<ImagePathReplacement> ) {
    return replacements.reduce(
        ( currentValue, [ from, to ] ) => currentValue.replaceAll( from, to ),
        value,
    )
}

function mapImagePathValue<T> ( value: T, mapper: ( currentValue: string ) => string ): T {
    if ( typeof value === 'string' ) {
        return mapper( value ) as T
    }

    if ( Array.isArray( value ) ) {
        return value.map( item => mapImagePathValue( item, mapper ) ) as T
    }

    if ( isPlainObject( value ) ) {
        return Object.fromEntries(
            Object.entries( value ).map( ( [ key, currentValue ] ) => [ key, mapImagePathValue( currentValue, mapper ) ] ),
        ) as T
    }

    return value
}

export function normalizeImageOrigin ( value = '' ) {
    if ( !value ) {
        return ''
    }

    try {
        return new URL( value ).origin
    }
    catch {
        return value.replace( /\/$/, '' )
    }
}

export function formatUrlLikeInput ( url: URL, input: string ) {
    return /^https?:\/\//i.test( input ) ? url.toString() : `${ url.pathname }${ url.search }`
}

export function makeWorkerTmdbImagePath ( origin = IMAGE_WORKER_ORIGIN ) {
    return `${ normalizeImageOrigin( origin ) }${ NETLIFY_TMDB_IMAGE_PATH }`
}

export function makeWorkerFanartImagePath ( origin = IMAGE_WORKER_ORIGIN ) {
    return `${ normalizeImageOrigin( origin ) }${ NETLIFY_FANART_IMAGE_PATH }`
}

export function expandImagePathPlaceholders<T> ( value: T ) {
    return mapImagePathValue(
        value,
        currentValue => replaceImagePathSegments( currentValue, defaultImagePathPlaceholders ),
    )
}

export function collapseImagePathsToPlaceholders<T> ( value: T ) {
    const imagePathReplacements: ImagePathReplacement[] = [
        [ makeWorkerTmdbImagePath(), TMDB_IMAGE_PATH_PLACEHOLDER ],
        [ makeWorkerFanartImagePath(), FANART_IMAGE_PATH_PLACEHOLDER ],
        [ NETLIFY_TMDB_IMAGE_PATH, TMDB_IMAGE_PATH_PLACEHOLDER ],
        [ NETLIFY_FANART_IMAGE_PATH, FANART_IMAGE_PATH_PLACEHOLDER ],
    ]

    imagePathReplacements.sort( ( [ left ], [ right ] ) => right.length - left.length )

    return mapImagePathValue(
        value,
        currentValue => replaceImagePathSegments( currentValue, imagePathReplacements ),
    )
}
