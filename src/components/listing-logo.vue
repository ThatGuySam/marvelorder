<template>
    <img 
        :data-src="srcImage"
        :data-srcset="srcSet"
        class="lazyload"
        :alt="alt"
    />
</template>

<script>

import 'lazysizes'
import 'lazysizes/plugins/attrchange/ls.attrchange'

function makeSizedImageUrl ( imageUrl, size ) {
    const sizeUrl = new URL( imageUrl, 'https://example.com' )

    sizeUrl.searchParams.set( 'width', size )

    return `${ sizeUrl.pathname }${ sizeUrl.search }`
}

export default {
    props: {
        src: {
            type: [ String, Object ],
            required: true
        },
        alt: {
            type: String,
            required: true
        }, 
        baseSize: {
            type: Number,
            default: 275
        },
        sizes: {
            type: Array,
            default: [ 1, 1.5, 2, 4, 5, 8 ]
        }
    },
    computed: {
        maxWidth () {
            return this.sizes[ this.sizes.length - 1 ]
        },
        logoUrl () {
            if ( this.src?.logo_on_black ) {
                return this.src.logo_on_black
            }

            return this.src
        },
		srcSet () {
			const srcSet = []

            for ( const size of this.sizes ) {
                const pixelWidth = Math.round( this.baseSize * size )
                
                srcSet.push( `${ makeSizedImageUrl( this.logoUrl, pixelWidth ) } ${ size }x` )
            }

            return srcSet.join( ', ' )
		},
        srcImage () {
            return makeSizedImageUrl( this.logoUrl, this.sizes[ 1 ] ) 
        },
    }
}
</script>
