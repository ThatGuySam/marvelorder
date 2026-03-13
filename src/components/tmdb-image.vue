<template>
    <img
        v-once
        :data-src="smallestImage"
        :data-srcset="srcSet"
        :sizes="`(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`"
        class="lazyload"
        :alt="alt"
    >
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import {
    formatUrlLikeInput,
} from '~/src/helpers/image-paths'
import {
    makeTmdbImageUrl,
} from '~/src/helpers/listing'

import 'lazysizes/plugins/attrchange/ls.attrchange'

function makeSizedImageUrl ( imageUrl: string, size: number ) {
    const sizeUrl = new URL( imageUrl, 'https://example.com' )

    sizeUrl.searchParams.set( 'width', size )

    return formatUrlLikeInput( sizeUrl, imageUrl )
}

export default defineComponent( {
    props: {
        src: {
            type: String,
            required: true,
        },
        alt: {
            type: String,
            required: true,
        },
        sizes: {
            type: Array as PropType<number[]>,
            default: () => [ 75, 100, 275, 550, 850, 1440 ],
        },
    },
    computed: {
        maxWidth (): number {
            return this.sizes[ this.sizes.length - 1 ]
        },
        imageUrl (): string {
            return makeTmdbImageUrl( this.src )
        },
        srcSet (): string {
            const srcSet: string[] = []

            for ( const size of this.sizes ) {
                srcSet.push( `${ makeSizedImageUrl( this.imageUrl, size ) } ${ size }w` )
            }

            return srcSet.join( ', ' )
        },
        smallestImage (): string {
            return makeSizedImageUrl( this.imageUrl, this.sizes[ 0 ] )
        },
    },
} )
</script>
