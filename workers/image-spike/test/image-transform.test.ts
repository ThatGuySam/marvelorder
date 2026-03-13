import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { PhotonImage, SamplingFilter, crop, resize } from '@cf-wasm/photon/node'
import sharp from 'sharp'
import { expect, test } from 'vitest'

import { processImageBytes } from '../src/image-transform'

const spiderManFixturePath = resolve(
    process.cwd(),
    'workers/image-spike/test/fixtures/tmdb/spider-man-beyond-the-spider-verse.tmdb-original.jpg',
)
const artifactDirectoryPath = resolve( process.cwd(), 'workers/image-spike/test/artifacts' )
const spiderManPhotonArtifactPath = resolve(
    artifactDirectoryPath,
    'spider-man-beyond-the-spider-verse.photon.webp',
)
const lowerBandRegion = {
    top: 0.42,
    bottom: 1,
    bandCount: 12,
} as const
const comparisonRegions = {
    bottom35pct: { left: 0, top: 0.65, right: 1, bottom: 1 },
    lowerHalf: { left: 0, top: 0.5, right: 1, bottom: 1 },
    manRegion: { left: 0.45, top: 0.42, right: 0.88, bottom: 1 },
} as const

const tmdbTransparentOptions = {
    width: 750,
    cropTop: 0,
    cropBottom: 0,
    transparent: true,
}

test( 'Photon tmdb transform keeps Spider-Man Beyond the Spider-Verse close to the Sharp baseline', async () => {
    const inputBytes = new Uint8Array( await readFile( spiderManFixturePath ) )
    const photonOutput = processImageBytes(
        {
            PhotonImage,
            SamplingFilter,
            crop,
            resize,
        },
        'tmdb',
        tmdbTransparentOptions,
        inputBytes,
    )

    const photonMetrics = await inspectImageMetrics( photonOutput )
    const sharpOutput = await renderSharpTmdbTransparentBaseline( inputBytes, tmdbTransparentOptions.width )
    const sharpMetrics = await inspectImageMetrics( sharpOutput )
    const comparisonMetrics = compareAgainstSharpBaseline( photonMetrics, sharpMetrics )

    await writeArtifacts( photonOutput )

    expect( {
        photon: makeSnapshotFriendlyMetrics( photonMetrics ),
        sharp: makeSnapshotFriendlyMetrics( sharpMetrics ),
        comparison: comparisonMetrics,
    } ).toMatchInlineSnapshot( `
      {
        "comparison": {
          "lowerBandAlphaMassRatios": [
            0.71,
            0.771,
            0.984,
            0.899,
            0.898,
            0.859,
            0.785,
            0.798,
            0.696,
            0.74,
            0.569,
            0.648,
          ],
          "lowerBandTailAlphaMassRatioMean": 0.663,
          "lowerBandTailVisibleLuminanceMassRatioMean": 0.757,
          "lowerBandVisibleLuminanceMassRatios": [
            0.681,
            0.843,
            0.989,
            0.962,
            0.945,
            0.913,
            0.859,
            0.86,
            0.74,
            0.813,
            0.77,
            0.704,
          ],
          "lowerBandWorstAlphaMassRatio": 0.569,
          "outputToSharp": {
            "overallAlphaMassRatio": 0.775,
            "overallNonTransparentPixelRatio": 0.738,
            "partialAlphaPixelRatio": 0.566,
          },
          "regions": {
            "bottom35pct": {
              "alphaMassRatio": 0.894,
              "alphaMeanRatio": 0.89,
              "visibleLuminanceMassRatio": 0.951,
              "visibleLuminanceMeanRatio": 0.946,
            },
            "lowerHalf": {
              "alphaMassRatio": 0.841,
              "alphaMeanRatio": 0.833,
              "visibleLuminanceMassRatio": 0.906,
              "visibleLuminanceMeanRatio": 0.897,
            },
            "manRegion": {
              "alphaMassRatio": 0.764,
              "alphaMeanRatio": 0.759,
              "visibleLuminanceMassRatio": 0.836,
              "visibleLuminanceMeanRatio": 0.831,
            },
          },
        },
        "photon": {
          "alphaMass": 13060976,
          "height": 265,
          "meanAlpha": 72.80162760235223,
          "nonTransparentPixelCount": 84810,
          "opaquePixelCount": 40968,
          "partialAlphaPixelCount": 43842,
          "transparentPixelCount": 94595,
          "visibleLuminanceMass": 4720538.582802313,
          "width": 677,
        },
        "sharp": {
          "alphaMass": 16844600,
          "height": 262,
          "meanAlpha": 94.40876125141519,
          "nonTransparentPixelCount": 114872,
          "opaquePixelCount": 37360,
          "partialAlphaPixelCount": 77512,
          "transparentPixelCount": 63550,
          "visibleLuminanceMass": 5494533.171887228,
          "width": 681,
        },
      }
    ` )

    expect( photonMetrics.width ).toBeLessThanOrEqual( tmdbTransparentOptions.width )
    expect( Math.abs( photonMetrics.width - sharpMetrics.width ) ).toBeLessThanOrEqual( 8 )
    expect( Math.abs( photonMetrics.height - sharpMetrics.height ) ).toBeLessThanOrEqual( 8 )
    expect( comparisonMetrics.outputToSharp.partialAlphaPixelRatio ).toBeGreaterThanOrEqual( 0.55 )
    expect( comparisonMetrics.regions.bottom35pct.alphaMassRatio ).toBeGreaterThanOrEqual( 0.85 )
    expect( comparisonMetrics.regions.manRegion.alphaMassRatio ).toBeGreaterThanOrEqual( 0.75 )
    expect( comparisonMetrics.regions.manRegion.visibleLuminanceMassRatio ).toBeGreaterThanOrEqual( 0.8 )
    expect( comparisonMetrics.lowerBandTailAlphaMassRatioMean ).toBeGreaterThanOrEqual( 0.65 )
    expect( comparisonMetrics.lowerBandWorstAlphaMassRatio ).toBeGreaterThanOrEqual( 0.55 )
} )

async function inspectImageMetrics ( imageBytes: Uint8Array ) {
    const {
        data,
        info,
    } = await sharp( Buffer.from( imageBytes ) )
        .ensureAlpha()
        .raw()
        .toBuffer( { resolveWithObject: true } )

    let transparentPixelCount = 0
    let partialAlphaPixelCount = 0
    let opaquePixelCount = 0
    let alphaSum = 0
    let visibleLuminanceMass = 0

    for ( let index = 0; index < data.length; index += 4 ) {
        const red = data[ index ]
        const green = data[ index + 1 ]
        const blue = data[ index + 2 ]
        const alphaValue = data[ index + 3 ]
        const luminance = ( 0.2126 * red ) + ( 0.7152 * green ) + ( 0.0722 * blue )

        alphaSum += alphaValue
        visibleLuminanceMass += luminance * ( alphaValue / 255 )

        if ( alphaValue === 0 ) {
            transparentPixelCount += 1
        }
        else if ( alphaValue === 255 ) {
            opaquePixelCount += 1
        }
        else {
            partialAlphaPixelCount += 1
        }
    }

    return {
        width: info.width,
        height: info.height,
        alphaMass: alphaSum,
        meanAlpha: alphaSum / ( data.length / 4 ),
        nonTransparentPixelCount: partialAlphaPixelCount + opaquePixelCount,
        opaquePixelCount,
        partialAlphaPixelCount,
        transparentPixelCount,
        visibleLuminanceMass,
        rawPixels: data,
    }
}

function makeSnapshotFriendlyMetrics (
    imageMetrics: Awaited<ReturnType<typeof inspectImageMetrics>>,
) {
    const {
        rawPixels,
        ...snapshotFriendlyMetrics
    } = imageMetrics

    return snapshotFriendlyMetrics
}

async function renderSharpTmdbTransparentBaseline ( inputBytes: Uint8Array, width: number ) {
    let workingBuffer = Buffer.from( inputBytes )

    workingBuffer = await sharp( workingBuffer )
        .resize( width, null, { withoutEnlargement: true } )
        .rotate()
        .toBuffer()

    workingBuffer = await sharp( workingBuffer )
        .trim()
        .toBuffer()

    const maskBuffer = await sharp( workingBuffer )
        .extractChannel( 'red' )
        .linear( 1.1, -( 128 * 1.1 ) + 128 )
        .modulate( { brightness: 6.5 } )
        .toBuffer()

    const {
        data,
    } = await sharp( workingBuffer )
        .ensureAlpha()
        .joinChannel( maskBuffer )
        .webp( { quality: 95, force: true } )
        .toBuffer( { resolveWithObject: true } )

    return new Uint8Array( data )
}

function compareAgainstSharpBaseline (
    photonMetrics: Awaited<ReturnType<typeof inspectImageMetrics>>,
    sharpMetrics: Awaited<ReturnType<typeof inspectImageMetrics>>,
) {
    const lowerBandPhotonRegions = getVerticalBandRegionMetrics(
        photonMetrics,
        lowerBandRegion.top,
        lowerBandRegion.bottom,
        lowerBandRegion.bandCount,
    )
    const lowerBandSharpRegions = getVerticalBandRegionMetrics(
        sharpMetrics,
        lowerBandRegion.top,
        lowerBandRegion.bottom,
        lowerBandRegion.bandCount,
    )

    const lowerBandAlphaMassRatios = lowerBandPhotonRegions.map( ( region, index ) => {
        return ratioToSharpBaseline( region.alphaMass, lowerBandSharpRegions[ index ].alphaMass )
    } )
    const lowerBandVisibleLuminanceMassRatios = lowerBandPhotonRegions.map( ( region, index ) => {
        return ratioToSharpBaseline(
            region.visibleLuminanceMass,
            lowerBandSharpRegions[ index ].visibleLuminanceMass,
        )
    } )
    const tailBandStartIndex = 8

    return {
        outputToSharp: {
            overallAlphaMassRatio: ratioToSharpBaseline( photonMetrics.alphaMass, sharpMetrics.alphaMass ),
            overallNonTransparentPixelRatio: ratioToSharpBaseline(
                photonMetrics.nonTransparentPixelCount,
                sharpMetrics.nonTransparentPixelCount,
            ),
            partialAlphaPixelRatio: ratioToSharpBaseline(
                photonMetrics.partialAlphaPixelCount,
                sharpMetrics.partialAlphaPixelCount,
            ),
        },
        regions: Object.fromEntries(
            Object.entries( comparisonRegions ).map( ( [ name, region ] ) => {
                const photonRegion = getRegionMetrics( photonMetrics, region )
                const sharpRegion = getRegionMetrics( sharpMetrics, region )

                return [
                    name,
                    {
                        alphaMassRatio: ratioToSharpBaseline( photonRegion.alphaMass, sharpRegion.alphaMass ),
                        alphaMeanRatio: ratioToSharpBaseline( photonRegion.alphaMean, sharpRegion.alphaMean ),
                        visibleLuminanceMassRatio: ratioToSharpBaseline(
                            photonRegion.visibleLuminanceMass,
                            sharpRegion.visibleLuminanceMass,
                        ),
                        visibleLuminanceMeanRatio: ratioToSharpBaseline(
                            photonRegion.visibleLuminanceMean,
                            sharpRegion.visibleLuminanceMean,
                        ),
                    },
                ]
            } ),
        ),
        lowerBandAlphaMassRatios,
        lowerBandVisibleLuminanceMassRatios,
        lowerBandTailAlphaMassRatioMean: roundToThreeDecimals(
            mean( lowerBandAlphaMassRatios.slice( tailBandStartIndex ) ),
        ),
        lowerBandTailVisibleLuminanceMassRatioMean: roundToThreeDecimals(
            mean( lowerBandVisibleLuminanceMassRatios.slice( tailBandStartIndex ) ),
        ),
        lowerBandWorstAlphaMassRatio: roundToThreeDecimals( Math.min( ...lowerBandAlphaMassRatios ) ),
    }
}

function getVerticalBandRegionMetrics (
    imageMetrics: Awaited<ReturnType<typeof inspectImageMetrics>>,
    top: number,
    bottom: number,
    bandCount: number,
) {
    return Array.from( { length: bandCount }, ( _, index ) => {
        return getRegionMetrics( imageMetrics, {
            left: index / bandCount,
            top,
            right: ( index + 1 ) / bandCount,
            bottom,
        } )
    } )
}

function getRegionMetrics (
    imageMetrics: Awaited<ReturnType<typeof inspectImageMetrics>>,
    region: {
        left: number
        top: number
        right: number
        bottom: number
    },
) {
    const left = Math.max( 0, Math.floor( imageMetrics.width * region.left ) )
    const right = Math.min( imageMetrics.width, Math.ceil( imageMetrics.width * region.right ) )
    const top = Math.max( 0, Math.floor( imageMetrics.height * region.top ) )
    const bottom = Math.min( imageMetrics.height, Math.ceil( imageMetrics.height * region.bottom ) )
    const pixelCount = Math.max( 1, ( right - left ) * ( bottom - top ) )
    let alphaMass = 0
    let visibleLuminanceMass = 0

    for ( let y = top; y < bottom; y += 1 ) {
        for ( let x = left; x < right; x += 1 ) {
            const index = ( ( y * imageMetrics.width ) + x ) * 4
            const red = imageMetrics.rawPixels[ index ]
            const green = imageMetrics.rawPixels[ index + 1 ]
            const blue = imageMetrics.rawPixels[ index + 2 ]
            const alpha = imageMetrics.rawPixels[ index + 3 ]
            const luminance = ( 0.2126 * red ) + ( 0.7152 * green ) + ( 0.0722 * blue )

            alphaMass += alpha
            visibleLuminanceMass += luminance * ( alpha / 255 )
        }
    }

    return {
        alphaMass,
        alphaMean: alphaMass / pixelCount,
        visibleLuminanceMass,
        visibleLuminanceMean: visibleLuminanceMass / pixelCount,
    }
}

function ratioToSharpBaseline ( value: number, baselineValue: number ) {
    if ( baselineValue === 0 ) {
        return 0
    }

    return roundToThreeDecimals( value / baselineValue )
}

function mean ( values: number[] ) {
    if ( values.length === 0 ) {
        return 0
    }

    return values.reduce( ( sum, value ) => sum + value, 0 ) / values.length
}

function roundToThreeDecimals ( value: number ) {
    return Math.round( value * 1000 ) / 1000
}

async function writeArtifacts ( photonOutput: Uint8Array ) {
    await mkdir( artifactDirectoryPath, { recursive: true } )
    await writeFile( spiderManPhotonArtifactPath, photonOutput )
}
