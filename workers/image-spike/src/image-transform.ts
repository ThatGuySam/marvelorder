export const BACKGROUND_TRIM_THRESHOLD = 12
export const ALPHA_TRIM_THRESHOLD = 8

export const SHARP_RED_CHANNEL_ALPHA_LOOKUP = [
    0, 0, 1, 7, 11, 14, 19, 23, 26, 30,
    34, 40, 44, 49, 54, 59, 66, 71, 79, 86,
    93, 101, 110, 119, 128, 136, 146, 156, 166, 175,
    185, 195, 203, 213, 223, 233, 243, 253, 255, 255,
] as const

export type RouteKind = 'tmdb' | 'fanart'

export interface TransformOptions {
    width: number
    cropTop: number
    cropBottom: number
    transparent: boolean
}

export interface PhotonImageLike {
    free (): void
    get_bytes_webp (): Uint8Array
    get_height (): number
    get_raw_pixels (): Uint8Array
    get_width (): number
}

interface PhotonImageConstructor {
    new ( pixels: Uint8Array, width: number, height: number ): PhotonImageLike
    new_from_byteslice ( bytes: Uint8Array ): PhotonImageLike
}

interface PhotonModule<SamplingFilterValue> {
    PhotonImage: PhotonImageConstructor
    SamplingFilter: {
        Lanczos3: SamplingFilterValue
    }
    crop (
        image: PhotonImageLike,
        left: number,
        top: number,
        width: number,
        height: number,
    ): PhotonImageLike
    resize (
        image: PhotonImageLike,
        width: number,
        height: number,
        filter: SamplingFilterValue,
    ): PhotonImageLike
}

interface TrimResult {
    pixels: Uint8Array
    width: number
    height: number
}

export function processImageBytes<SamplingFilterValue> (
    photon: PhotonModule<SamplingFilterValue>,
    kind: RouteKind,
    options: TransformOptions,
    inputBytes: Uint8Array,
): Uint8Array {
    const cleanup: PhotonImageLike[] = []

    try {
        let working = photon.PhotonImage.new_from_byteslice( inputBytes )
        cleanup.push( working )

        if ( options.cropTop > 0 || options.cropBottom > 0 ) {
            const cropped = cropByFractions( photon, working, options.cropTop, options.cropBottom )
            cleanup.push( cropped )
            working = cropped
        }

        if ( working.get_width() > options.width ) {
            const targetWidth = options.width
            const targetHeight = Math.max(
                1,
                Math.round( ( working.get_height() * targetWidth ) / working.get_width() ),
            )

            const resized = photon.resize(
                working,
                targetWidth,
                targetHeight,
                photon.SamplingFilter.Lanczos3,
            )

            cleanup.push( resized )
            working = resized
        }

        let output = working

        if ( kind === 'fanart' ) {
            const trimmed = trimPhotonImage( photon, working, BACKGROUND_TRIM_THRESHOLD )
            if ( trimmed ) {
                cleanup.push( trimmed )
                output = trimmed
            }
        }
        else if ( options.transparent ) {
            if ( hasTransparentPixels( working ) ) {
                const trimmed = trimPhotonImageByAlpha( photon, working, ALPHA_TRIM_THRESHOLD )
                if ( trimmed ) {
                    cleanup.push( trimmed )
                    output = trimmed
                }
            }
            else {
                const transparentLogo = makeTransparentLogo( photon, working )
                cleanup.push( transparentLogo )
                output = transparentLogo

                const trimmed = trimPhotonImageByAlpha( photon, transparentLogo, ALPHA_TRIM_THRESHOLD )
                if ( trimmed ) {
                    cleanup.push( trimmed )
                    output = trimmed
                }
            }
        }

        return output.get_bytes_webp()
    }
    finally {
        for ( const image of cleanup ) {
            image.free()
        }
    }
}

function cropByFractions<SamplingFilterValue> (
    photon: PhotonModule<SamplingFilterValue>,
    image: PhotonImageLike,
    cropTop: number,
    cropBottom: number,
): PhotonImageLike {
    const width = image.get_width()
    const height = image.get_height()
    const top = Math.round( cropTop * height )
    const bottom = Math.round( cropBottom * height )
    const targetHeight = Math.max( 1, height - top - bottom )

    return photon.crop( image, 0, top, width, top + targetHeight )
}

function trimPhotonImage<SamplingFilterValue> (
    photon: PhotonModule<SamplingFilterValue>,
    image: PhotonImageLike,
    threshold: number,
): PhotonImageLike | null {
    const trimmed = trimRgbaPixels(
        image.get_raw_pixels(),
        image.get_width(),
        image.get_height(),
        threshold,
    )

    if ( !trimmed ) {
        return null
    }

    return new photon.PhotonImage( trimmed.pixels, trimmed.width, trimmed.height )
}

function trimPhotonImageByAlpha<SamplingFilterValue> (
    photon: PhotonModule<SamplingFilterValue>,
    image: PhotonImageLike,
    threshold: number,
): PhotonImageLike | null {
    const trimmed = trimRgbaPixelsByAlpha(
        image.get_raw_pixels(),
        image.get_width(),
        image.get_height(),
        threshold,
    )

    if ( !trimmed ) {
        return null
    }

    return new photon.PhotonImage( trimmed.pixels, trimmed.width, trimmed.height )
}

function trimRgbaPixels (
    pixels: Uint8Array,
    width: number,
    height: number,
    threshold: number,
): TrimResult | null {
    if ( width <= 0 || height <= 0 ) {
        return null
    }

    const background = pixels.slice( 0, 4 )
    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1

    for ( let y = 0; y < height; y += 1 ) {
        for ( let x = 0; x < width; x += 1 ) {
            const index = ( ( ( y * width ) + x ) * 4 )

            if ( isPixelDifferent( pixels, index, background, threshold ) ) {
                if ( x < minX ) {
                    minX = x
                }
                if ( y < minY ) {
                    minY = y
                }
                if ( x > maxX ) {
                    maxX = x
                }
                if ( y > maxY ) {
                    maxY = y
                }
            }
        }
    }

    if ( maxX === -1 || maxY === -1 ) {
        return null
    }

    if ( minX === 0 && minY === 0 && maxX === width - 1 && maxY === height - 1 ) {
        return null
    }

    const trimmedWidth = ( maxX - minX ) + 1
    const trimmedHeight = ( maxY - minY ) + 1
    const trimmedPixels = new Uint8Array( trimmedWidth * trimmedHeight * 4 )

    for ( let y = 0; y < trimmedHeight; y += 1 ) {
        const sourceRowStart = ( ( ( minY + y ) * width ) + minX ) * 4
        const targetRowStart = y * trimmedWidth * 4
        const sourceRowEnd = sourceRowStart + ( trimmedWidth * 4 )

        trimmedPixels.set( pixels.slice( sourceRowStart, sourceRowEnd ), targetRowStart )
    }

    return {
        pixels: trimmedPixels,
        width: trimmedWidth,
        height: trimmedHeight,
    }
}

function trimRgbaPixelsByAlpha (
    pixels: Uint8Array,
    width: number,
    height: number,
    threshold: number,
): TrimResult | null {
    if ( width <= 0 || height <= 0 ) {
        return null
    }

    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1

    for ( let y = 0; y < height; y += 1 ) {
        for ( let x = 0; x < width; x += 1 ) {
            const alpha = pixels[ ( ( ( y * width ) + x ) * 4 ) + 3 ]

            if ( alpha > threshold ) {
                if ( x < minX ) {
                    minX = x
                }
                if ( y < minY ) {
                    minY = y
                }
                if ( x > maxX ) {
                    maxX = x
                }
                if ( y > maxY ) {
                    maxY = y
                }
            }
        }
    }

    if ( maxX === -1 || maxY === -1 ) {
        return null
    }

    if ( minX === 0 && minY === 0 && maxX === width - 1 && maxY === height - 1 ) {
        return null
    }

    const trimmedWidth = ( maxX - minX ) + 1
    const trimmedHeight = ( maxY - minY ) + 1
    const trimmedPixels = new Uint8Array( trimmedWidth * trimmedHeight * 4 )

    for ( let y = 0; y < trimmedHeight; y += 1 ) {
        const sourceRowStart = ( ( ( minY + y ) * width ) + minX ) * 4
        const targetRowStart = y * trimmedWidth * 4
        const sourceRowEnd = sourceRowStart + ( trimmedWidth * 4 )

        trimmedPixels.set( pixels.slice( sourceRowStart, sourceRowEnd ), targetRowStart )
    }

    return {
        pixels: trimmedPixels,
        width: trimmedWidth,
        height: trimmedHeight,
    }
}

function isPixelDifferent (
    pixels: Uint8Array,
    index: number,
    background: Uint8Array,
    threshold: number,
): boolean {
    const alpha = pixels[ index + 3 ]
    const backgroundAlpha = background[ 3 ]

    if ( Math.abs( alpha - backgroundAlpha ) > threshold ) {
        return true
    }

    for ( let channel = 0; channel < 3; channel += 1 ) {
        if ( Math.abs( pixels[ index + channel ] - background[ channel ] ) > threshold ) {
            return true
        }
    }

    return alpha > threshold
}

function makeTransparentLogo<SamplingFilterValue> (
    photon: PhotonModule<SamplingFilterValue>,
    image: PhotonImageLike,
): PhotonImageLike {
    const pixels = image.get_raw_pixels().slice()

    for ( let index = 0; index < pixels.length; index += 4 ) {
        const red = pixels[ index ]
        pixels[ index + 3 ] = makeSharpLikeAlphaFromRed( red )
    }

    return new photon.PhotonImage( pixels, image.get_width(), image.get_height() )
}

function hasTransparentPixels ( image: PhotonImageLike ): boolean {
    const pixels = image.get_raw_pixels()

    for ( let index = 3; index < pixels.length; index += 4 ) {
        if ( pixels[ index ] < 255 ) {
            return true
        }
    }

    return false
}

export function makeSharpLikeAlphaFromRed ( red: number ): number {
    if ( red < SHARP_RED_CHANNEL_ALPHA_LOOKUP.length ) {
        return SHARP_RED_CHANNEL_ALPHA_LOOKUP[ red ]
    }

    return 255
}
