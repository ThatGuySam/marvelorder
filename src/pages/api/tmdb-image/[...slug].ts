import fetch from 'node-fetch'
import getImageTypeFromBuffer from 'image-type'
import sharp from 'sharp'
import etag from 'etag'
import isSvg from 'is-svg'
import sizeOf from 'image-size'

import type { APIRoute } from 'astro'

// Sizes at https://api.themoviedb.org/3/configuration
const base_url = 'https://image.tmdb.org/t/p/original'

// 6MB is hard max Lambda response size
const MAX_RESPONSE_SIZE = 6291456

const IGNORED_FORMATS = new Set( [
    'svg',
    'gif',
] )
const OUTPUT_FORMATS = new Set( [
    'jpg',
    'png',
    'webp',
    'avif',
] )

function getImageType ( buffer ) {
    const type = getImageTypeFromBuffer( buffer )
    if ( type ) {
        return type
    }
    if ( isSvg( buffer ) ) {
        return { ext: 'svg', mime: 'image/svg' }
    }
    return null
}

function getOptions ( eventUrlString ) {
    const eventUrl = new URL( eventUrlString, process.env.URL )

    // console.log('searchParams', Object.fromEntries( eventUrl.searchParams ))

    const {
        width: widthParam = 750,
        // q = 95,
        'crop.top': cropTop = 0,
        'crop.bottom': cropBottom = 0,
        transparent = 1,
        // format = null,
    } = Object.fromEntries( eventUrl.searchParams )

    const width = Number.parseInt( widthParam )

    if ( !width ) {
        throw new Error( 'Width is not a number' )
    }

    const quality = 95// parseInt(q) || 60

    const imagePath = eventUrl.pathname.split( 'tmdb-image/' )[ 1 ]

    const contentUrl = `${ base_url }/${ imagePath }`

    // Just always assume it's a jpg source
    const requestExtension = imagePath.split( /[#?]/ )[ 0 ].split( '.' ).pop().trim()

    return {
        width,
        quality,
        cropTop,
        cropBottom,
        contentUrl,
        requestExtension,
        transparent: Number( transparent ),
        // format,
    }
}

// Example URL
// https://marvelorder-full-static.netlify.app/.netlify/functions/wp-image/marvelorderstaging.wpengine.com/2021/11/Chamber-1-V2.jpg?w=800&q=80&format
export async function handler ( event ) {
    // console.log('event', event)

    let options = {}

    // Parse and validate options
    try {
        options = getOptions( event.url.href )
    }
    catch ( error ) {
        console.error( 'Invalid image options', error )

        return {
            statusCode: 400,
            body: 'Invalid image options',
        }
    }

    const {
        width,
        quality,
        cropTop,
        cropBottom,
        contentUrl,
        requestExtension,
    } = options

    let sourceImage

    // Move Request Extension to the start of the list
    // so that it is the first to be tried
    const imageTypes = new Set( [
        // We want to try the most common format first
        // so that we avoid extra requests
        'jpg',
        requestExtension,
        ...OUTPUT_FORMATS,
    ] )

    // Run through image types until we find one that works
    for ( const imageType of imageTypes ) {
        const typeUrl = contentUrl.replace( `.${ requestExtension }`, `.${ imageType }` )

        // Fetch our image
        sourceImage = await fetch( typeUrl )

        // If we got a 200, we're good
        if ( sourceImage.status === 200 ) {
            break
        }

        // Otherwise, try the next type
    }

    // If we don't have an image, we're done
    if ( !sourceImage.ok ) {
        console.error( `Failed to download image ${ contentUrl }. Status ${ sourceImage.status } ${ sourceImage.statusText }` )
        return {
            statusCode: sourceImage.status,
            body: sourceImage.statusText,
        }
    }

    // console.log('imageTypes', imageTypes) // eslint-disable-line no-console

    let workingBuffer = await sourceImage.buffer()

    const sourceType = getImageType( workingBuffer )

    if ( !sourceType ) {
        return { statusCode: 400, body: 'Source does not appear to be an image' }
    }

    const { ext } = sourceType

    // For unsupported formats (gif, svg) we redirect to the original
    if ( IGNORED_FORMATS.has( ext ) ) {
        return {
            statusCode: 302,
            headers: {
                Location: contentUrl,
            },
        }
    }

    const source = sizeOf( workingBuffer )

    const extractOptions = {
        left: 0,
        top: Math.round( cropTop * source.height ),
        width: source.width,
        height: Math.round( ( 1 - cropBottom ) * source.height - ( cropTop * source.height ) ),
    }

    // If there is a crop, crop it
    if ( cropTop > 0 || cropBottom > 0 ) {
        workingBuffer = await sharp( workingBuffer )
            .extract( extractOptions )
            .toBuffer()
    }

    // Rotate and Resize the image
    workingBuffer = await sharp( workingBuffer )
        .resize( width, null, { withoutEnlargement: true } )
        .rotate()
        .toBuffer()

    // console.log('options.transparent', options.transparent)

    let maskBuffer = []

    // Handle image transparency
    if ( options.transparent ) {
        // Trim source image
        workingBuffer = await sharp( workingBuffer )
            .trim()
            .toBuffer()

        // Set contrast and brightness for mask - https://github.com/lovell/sharp/issues/1958#issuecomment-552115591
        const contrast = 1.1
        const brightness = 6.5

        // Use an RGB channel buffer to create a easy Mask
        // https://github.com/lovell/sharp/issues/1113#issuecomment-363187713
        maskBuffer = await sharp( workingBuffer )
            // .rotate()
            // .greyscale()
            .extractChannel( 'red' ) // also B or G would work
            .linear( contrast, -( 128 * contrast ) + 128 )
            .modulate( { brightness } )
            .toBuffer()
    }

    // The format methods are just to set options: they don't
    // make it return that format.
    const { info, data: outputBuffer } = await sharp( workingBuffer )
        .ensureAlpha()
        .joinChannel( maskBuffer )
        // .jpeg({ quality, force: requestExtension === 'jpg' })
        // .png({ quality, force: true })
        .webp( { quality, force: true } )
        // .avif({ quality, force: requestExtension === 'avif' })
        .toBuffer( { resolveWithObject: true } )

    if ( outputBuffer.length > MAX_RESPONSE_SIZE ) {
        return {
            statusCode: 400,
            body: 'Requested image is too large. Maximum size is 6MB.',
        }
    }

    return {
        statusCode: 200,
        headers: {
            'Content-Type': `image/${ info.format }`,
            'Cache-Control': 'public, max-age=365000000, immutable',
            'etag': etag( outputBuffer ),
        },
        body: outputBuffer,
        isBase64Encoded: true,
    }
}

export default handler

export const get: APIRoute = async ( context ) => {
    try {
        // console.log( { context } )

        const {
            statusCode = 500,
            // cacheControl = 'public, max-age=31536000, immutable',
            headers = {},
            body,
        } = await handler( context )

        return new Response( body, {
            status: statusCode,
            headers,
            // encoding: 'binary',
        } )
    }
    catch ( error ) {
        console.warn( error )

        return new Response( JSON.stringify( 'Error' ), {
            status: 500,
        } )
    }
}
