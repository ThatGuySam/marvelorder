<template>
    <img
        :data-src="srcImage"
        :data-srcset="srcSet"
        class="lazyload"
        :alt="alt"
    >
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'

import 'lazysizes/plugins/attrchange/ls.attrchange'
import type { Listing } from '~/src/helpers/types'

type ListingLogoSource = string | Pick<Listing, 'logo_on_black'>

function makeSizedImageUrl ( imageUrl: string, size: number ) {
    const sizeUrl = new URL( imageUrl, 'https://example.com' )

    sizeUrl.searchParams.set( 'width', size )

    return `${ sizeUrl.pathname }${ sizeUrl.search }`
}

export default defineComponent( {
    props: {
        src: {
            type: [ String, Object ] as PropType<ListingLogoSource>,
            required: true,
        },
        alt: {
            type: String,
            required: true,
        },
        baseSize: {
            type: Number,
            default: 275,
        },
        sizes: {
            type: Array as PropType<number[]>,
            default: () => [ 1, 1.5, 2, 4, 5, 8 ],
        },
    },
    computed: {
        logoUrl (): string {
            if ( typeof this.src === 'object' && this.src?.logo_on_black ) {
                return this.src.logo_on_black
            }

            return this.src
        },
        srcSet (): string {
            const srcSet: string[] = []

            for ( const size of this.sizes ) {
                const pixelWidth = Math.round( this.baseSize * size )

                srcSet.push( `${ makeSizedImageUrl( this.logoUrl, pixelWidth ) } ${ size }x` )
            }

            return srcSet.join( ', ' )
        },
        srcImage (): string {
            return makeSizedImageUrl( this.logoUrl, this.sizes[ 1 ] )
        },
    },
} )
</script>
