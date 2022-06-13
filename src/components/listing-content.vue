<template>
    <div class="flex flex-col gap-8 pb-16">
        <div class="relative aspect-video">
            <!-- <img 
                :src="backdropUrl"
            /> -->
            <ListingLogo 
                :src="listing"
                class="h-full w-full object-contain relative"
            />
        </div>

        <h1 class="content-title text-3xl md:text-5xl font-black" id="overview">{{ listing.title }}</h1>

		<h2  class="font-bold" id="description">Description</h2>
		<div class="content-description">
			{{ listing.overview }}
		</div>

        <div class="credits opacity-50">
            <div>Data provided by <a class="underline" href="https://www.themoviedb.org/">The Movie Database</a></div>
            <div
                v-if="hasFanartLogo( listing )"
            >Image provided by <a class="underline" href="https://fanart.tv/">Fanart.tv</a></div>
        </div>

    </div>
</template>

<script>
import { makeFunctionUrlFromTmdb } from '~/src/helpers/url.ts'
import { hasFanartLogo } from '~/src/helpers/listing-filters.ts'

import ListingLogo from './listing-logo.vue'

export default {
    components: {
        ListingLogo
    },
    props: {
        listing: {
            type: Object,
            required: true
        }
    },
    methods: {
        hasFanartLogo
    },
    computed: {
        backdropUrl () {
            return makeFunctionUrlFromTmdb( this.listing.backdrop_path )
        },
    }
}
</script>
