<template>
    <div class="flex flex-col items-start gap-8">
        <div class="relative aspect-video w-full flex items-center px-12">
            <ListingLogo 
                :src="mappedListing"
                :baseSize="540"
                class="h-auto w-full relative transition-all"
            />
        </div>

        <h1 
            class="content-title text-3xl md:text-5xl font-black" 
            id="overview"
        >{{ mappedListing.title }}</h1>

        <div
            v-if="daysUntilRelease !== null"
            class="w-full"
        >
            <div class="text-xs">Releases in</div>
            <div class="text-2xl font-bold">{{ daysUntilRelease }} Days</div>
        </div>

        <ButtonLink
            v-if="isValidHttpUrl( mappedListing?.rentLinks?.amazon ) && context !== 'listing-page'"
            :href="mappedListing.rentLinks.amazon"
            target="_blank"
            class="amazon-link text-black text-sm font-bold bg-amber-400"
        >
            <div class="flex">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                </svg>
                <div>
                    Watch on Prime Video
                </div>
            </div>
        </ButtonLink>

		<h2  class="font-bold" id="description">Description</h2>
		<div class="content-description">
			{{ mappedListing.overview }}
		</div>

        <div class="credits opacity-50">
            <div>Title data via <a class="underline" href="https://www.themoviedb.org/">The Movie Database</a></div>
            <div
                v-if="hasFanartLogo( mappedListing )"
            >Image via <a class="underline" href="https://fanart.tv/">Fanart.tv</a></div>

            <div
                v-if="isMcuSheetOrdered( mappedListing )"
            >Timeline Order data via <a class="underline" href="https://docs.google.com/spreadsheets/d/1Xfe--9Wshbb3ru0JplA2PnEwN7mVawazKmhWJjr_wKs/edit#gid=0">r/MarvelStudios MCU Viewing</a></div>

            
        </div>

        <span class="relative z-0 inline-flex text-center md:flex-row flex-col shadow-sm md:divide-x md:divide-y-0 divide-y divide-gray-700 border border-gray-300 rounded-md bg-black/50 md:py-3 md:px-0 px-4">
            <template 
                v-for="(link, i) in links"
                :key="i"
            >
                <a
                    v-if="link.enabled"
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
            </template>
        </span>

    </div>
</template>

<script>
import { DateTime, Interval } from 'luxon'

import { isValidHttpUrl } from '~/src/helpers/check.ts'  
import { makeFunctionUrlFromTmdb } from '~/src/helpers/url.ts'
import { ensureMappedListing } from '~/src/helpers/node/listing.ts'
import { 
    hasFanartLogo, 
    isUpcoming,
    isMcuSheetOrdered
} from '~/src/helpers/listing-filters.ts'

import ListingLogo from './listing-logo.vue'
import ButtonLink from './button-link.vue'

const now = DateTime.now()

export default {
    components: {
        ListingLogo,
        ButtonLink
    },
    props: {
        listing: {
            type: Object,
            required: true
        },
        context: {
            type: String,
            default: 'listing-column'
        }
    },
    methods: {
        isValidHttpUrl,

        // Filters
        hasFanartLogo,
        isMcuSheetOrdered
    },
    computed: {
        mappedListing () {

            // console.log( 'this.listing', this.listing )

            // Map the listing to the correct format
            return ensureMappedListing( this.listing )
        }, 
        daysUntilRelease () {
            if ( !isUpcoming( this.mappedListing ) ) return null

            this.mappedListing.date

            const untilRelease = Interval.fromDateTimes( now, this.mappedListing.date )

            return Math.round( untilRelease.length('days') )
        },
        links () {
            return [
                {
                    enabled: this.context !== 'listing-page',
                    label: 'Full details',
                    href: this.mappedListing.endpoint
                },
                {
                    enabled: true,
                    label: 'Edit on GitHub',
                    href: this.mappedListing.githubEditUrl
                },
            ]
        },
        backdropUrl () {
            return makeFunctionUrlFromTmdb( this.mappedListing.backdrop_path )
        },
    }
}
</script>
