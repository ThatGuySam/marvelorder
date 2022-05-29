<template>
    <img 
        :data-src="smallestImage"
        :data-srcset="srcSet"
        :sizes="`(max-width: ${ maxWidth }px) 100vw, ${ maxWidth }px`"
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
            type: String,
            required: true
        },
        alt: {
            type: String,
            required: true
        }, 
        sizes: {
            type: Array,
            default: [ 100, 275, 550, 900 ]
        }
    },
    computed: {
        maxWidth () {
            return this.sizes[ this.sizes.length - 1 ]
        },
		srcSet () {
			const srcSet = []

            for ( const size of this.sizes ) {
                
                srcSet.push( `${ makeSizedImageUrl( this.src, size ) } ${ size }w` )
            }

            return srcSet.join( ', ' )
		},
        smallestImage () {
            return makeSizedImageUrl( this.src, this.sizes[ 0 ] ) 
        },
    }
}
</script>
