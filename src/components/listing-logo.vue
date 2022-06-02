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
            type: [ String, Object ],
            required: true
        },
        alt: {
            type: String,
            required: true
        }, 
        sizes: {
            type: Array,
            default: [ 75, 100, 275, 550, 850, 1440 ]
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
                
                srcSet.push( `${ makeSizedImageUrl( this.logoUrl, size ) } ${ size }w` )
            }

            return srcSet.join( ', ' )
		},
        smallestImage () {
            return makeSizedImageUrl( this.logoUrl, this.sizes[ 0 ] ) 
        },
    }
}
</script>
