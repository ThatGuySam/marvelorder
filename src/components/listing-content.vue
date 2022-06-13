<template>
    <div class="flex flex-col gap-8">
        <div class="relative aspect-video w-full flex items-center px-12">
            <ListingLogo 
                :src="listing"
                class="h-auto w-full relative transition-all"
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

        <span class="relative z-0 inline-flex text-center md:flex-row flex-col shadow-sm md:divide-x md:divide-y-0 divide-y divide-gray-700 border border-gray-300 rounded-md bg-gray-900 md:py-3 md:px-0 px-4">
            <a
                v-for="(link, i) in links"
                :key="i"
                type="button"
                :href="link.href"
                :class="[
                    'relative inline-flex justify-center items-center font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500',
                    'text-white',
                ]"
            >
                <div
                    :class="[
                        'inner-link hover:bg-indigo-400 active:bg-indigo-600 rounded-md px-4 md:py-2 md:mx-0 md:-my-3',
                        'py-3 -mx-4',
                        // First Link
                        // i === 0 && 'rounded-l-md',
                        // Not first Link
                        i !== 0 ? 'md:-ml-px' : '',
                        // Last Link
                        // i === totalLinks - 1 ? 'rounded-r-md' : ''
                    ]"
                >
                    {{ link.label }}
                </div>
            </a>
        </span>

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
        links () {
            return [
                {
                    label: 'Edit on GitHub',
                    href: this.listing.githubEditUrl
                },
            ]
        },
        backdropUrl () {
            return makeFunctionUrlFromTmdb( this.listing.backdrop_path )
        },
    }
}
</script>
