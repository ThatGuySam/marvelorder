<template>
    <img 
        :src="src"
        :src-set="srcSet"
        :sizes="`(max-width: ${ maxWidth }px) 100vw, ${ maxWidth }px`"
        :alt="alt"
    />
</template>

<script>

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
                const sizeUrl = new URL( this.src, 'https://example.com' )

                sizeUrl.searchParams.set( 'width', size )

                console.log('sizeUrl', sizeUrl)
                
                srcSet.push( `${ sizeUrl.pathname }${ sizeUrl.search } ${ size }w` )
            }

            return srcSet.join( ', ' )
		}
    }
}
</script>
