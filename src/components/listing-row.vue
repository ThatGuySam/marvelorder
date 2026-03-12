<template>
    <div class="listing-row-container relative fill-height w-screen">
        <div
            ref="row"
            class="listing-row flex overflow-x-auto whitespace-no-wrap px-32"
            style="scroll-snap-type: x mandatory;"
        >
            <div class="start-cap w-full flex-shrink-0 max-w-xs snap-start" />

            <template
                v-for="(listing, index) in sortedListings"
                :key="index"
            >
                <ListingColumn
                    :ref="listing.elementId"
                    :listing="listing"
                    :index="index"
                    :visibility-class="visibilityClass(listing)"
                    :class="[
                        isFocusedListing(listing) ? 'listing-card-initial' : '',
                    ]"

                    :expanded="expandedListingId === listing.elementId"
                    @expand="expandedListingId = listing.elementId"
                    @contract="expandedListingId = null"
                />
            </template>

            <div class="end-cap w-full flex-shrink-0 max-w-xs snap-end" />
        </div>

        <CircleButton
            class="absolute left-12 transform -translate-y-1/2 -translate-x-1/2"
            style="top:50%;"
            aria-label="Scroll to previous listings"

            @click="scroll(-0.8)"
        >
            <svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5 text-gray-400" style="transform: scaleX(-1);">
                <path
                    fill-rule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clip-rule="evenodd"
                />
            </svg>
        </CircleButton>
        <CircleButton
            class="absolute right-12 transform -translate-y-1/2 translate-x-1/2"
            style="top:50%;"
            aria-label="Scroll to next listings"

            @click="scroll(0.8)"
        >
            <svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5 text-gray-400">
                <path
                    fill-rule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clip-rule="evenodd"
                />
            </svg>
        </CircleButton>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import scrollIntoView from 'scroll-into-view-if-needed'

import ListingColumn from './listing-column.vue'
import CircleButton from './circle-button.vue'
import {
    FilteredListings,
    isUpcoming,
} from '~/src/helpers/listing-filters'
import type { MappedListing } from '~/src/helpers/node/listing'
import type { Listing } from '~/src/helpers/types'

type ListingLike = Listing | MappedListing
type ActiveListingFilters = Array<[Function, boolean]>
type ListingColumnRef = {
    $el: HTMLElement
}

function hasLogo ( listing: MappedListing ): boolean {
    return Boolean( listing.hasLogo )
}

export default defineComponent( {
    components: {
        ListingColumn,
        CircleButton,
    },
    props: {
        listings: {
            type: Array as PropType<ListingLike[]>,
            required: true,
        },
        initialSort: {
            type: String,
            default: 'default',
        },
    },
    data () {
        return {
            activeListingFilters: [] as ActiveListingFilters,
            showAllListings: false,
            expandedListingId: null as string | null,
        }
    },
    computed: {
        filteredListings (): FilteredListings {
            return new FilteredListings( {
                listings: this.listings,
                initialFilters: this.activeListingFilters,
                listingsSort: this.initialSort,
            } )
        },
        sortedListings (): MappedListing[] {
            return this.filteredListings.list
        },
        upcomingListings (): MappedListing[] {
            return this.filteredListings.withFilters( [
                [ isUpcoming, true ],
            ] )
        },
        nextUpcomingListing (): MappedListing | undefined {
            return this.upcomingListings[ 0 ]
        },
        lastListing (): MappedListing | undefined {
            return this.sortedListings[ this.sortedListings.length - 1 ]
        },
        focusedListing (): MappedListing | undefined {
            if ( !this.nextUpcomingListing ) {
                return this.lastListing
            }

            return this.nextUpcomingListing
        },
    },
    mounted () {
        // Reveal all listings after a delay
        setTimeout( () => {
            this.showAllListings = true
        }, 1000 )

        void this.scrollToUpcomingListing()

        // Count listings with logos
        const hasLogoListings = this.sortedListings.filter( hasLogo )
        const noLogoListings = this.sortedListings.filter( listing => !hasLogo( listing ) )

        console.log( `Listings with Logos: ${ hasLogoListings.length } / ${ this.sortedListings.length }` )

        console.log( 'Listings without Logos:' )
        for ( const listing of noLogoListings ) {
            console.log( `${ listing.title } (${ listing.id })` )
        }

        // const marvelKnights = new FilteredListings( {
        //     listings: this.listings,
        //     initialFilters: new Map( [
        //         [ isMarvelKnightsAnimated, true ],
        //     ] ),
        // } )

        // console.log('marvelKnights', marvelKnights.list)
    },
    methods: {
        async scrollToUpcomingListing (): Promise<void> {
            if ( !this.focusedListing ) {
                return
            }

            const { elementId } = this.focusedListing
            const listingRefs = this.$refs[ elementId ] as ListingColumnRef[] | undefined
            const elementRef = listingRefs?.[ 0 ]
            const elementNode = elementRef?.$el

            if ( !elementNode ) {
                return
            }

            const targetNode = elementNode.previousElementSibling?.previousElementSibling

            if ( !targetNode ) {
                return
            }

            // Instant scroll to element before
            // so we can setup a small scroll animation
            // this.$refs.row.scrollLeft = elementNode.previousElementSibling.offsetLeft - window.innerWidth + 275

            // Animate scroll to element before
            //  so that our whole column is visible
            await scrollIntoView( targetNode, {
                scrollMode: 'always',
                behavior: 'smooth',
                block: 'start',
                inline: 'start',
                duration: 1500,
            } )
        },

        isFocusedListing ( listing: MappedListing ): boolean {
            return listing.elementId === this.focusedListing?.elementId
        },

        visibilityClass ( listing: MappedListing ): string {
            // Show our upcoming listing first
            if ( listing.elementId === this.focusedListing?.elementId ) {
                return ''
            }

            return this.showAllListings ? '' : 'opacity-0'
        },

        // Scrolls by window width time ratio
        scroll ( ratio: number ): void {
            const windowWidth = window.innerWidth
            const scrollDistance = windowWidth * ratio

            const row = this.$refs.row as HTMLElement | undefined

            row?.scrollBy( {
                // top: 100, // negative value acceptable
                left: scrollDistance,
                behavior: 'smooth',
            } )
        },
    },
} )
</script>
