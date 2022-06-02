<template>

	<div class="listing-row-container relative fill-height w-screen">

		<div 
			ref="row"
			class="listing-row flex overflow-x-auto whitespace-no-wrap" 
			style="scroll-snap-type: x mandatory;"
		>

			<div class="start-cap w-full flex-shrink-0 max-w-xs" />

			<template
				v-for="( listing, index ) in sortedListings"
				:key="index"
			>
				<ListingColumn 
					:ref="listing.elementId"
					:listing="listing"
					:index="index"
					:visibility-class="visibilityClass( listing )"
					:class="[
						isListingNextUpcoming( listing ) ? 'listing-card-next-upcoming' : '',
					]"
				/>
			</template>

			<div class="end-cap  w-full flex-shrink-0 max-w-xs snap-end" />

		</div>

		<button 
			:class="[
				'absolute left-12 h-16 w-16 flex justify-center items-center transform -translate-y-1/2 -translate-x-1/2 bg-black/25 backdrop-blur rounded-full', 
				'transition-all duration-200 ease-in-out',
			]" 
			style="top:50%;" 
			aria-label="Scroll to previous listings"

			@click="scroll( -0.8 )"
		>
			<svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5 text-gray-400" style="transform: scaleX(-1);">
				<path 
					fill-rule="evenodd" 
					d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
					clip-rule="evenodd"
				></path>
			</svg>
		</button>
		<button 
			:class="[
				'absolute right-12 h-16 w-16 flex justify-center items-center transform -translate-y-1/2 translate-x-1/2 bg-black/25 backdrop-blur rounded-full', 
				'transition-all duration-200 ease-in-out',
			]" 
			style="top:50%;" 
			aria-label="Scroll to next listings"

			@click="scroll( 0.8 )"
		>
			<svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5 text-gray-400">
				<path 
					fill-rule="evenodd" 
					d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
					clip-rule="evenodd"
				></path>
			</svg>
		</button>

	</div>

</template>

<script>

import scrollIntoView from 'scroll-into-view-if-needed'


import { byListingDate } from '~/src/helpers/sort.ts'
import { MappedListing } from '~/src/helpers/node/listing.ts'
import { matchesFilters, isDoc, isUpcoming } from '~/src/helpers/listing-filters.ts'

import ListingColumn from './listing-column.vue'



export default {
	components: {
		ListingColumn
	},
    props: {
        listings: {
            type: Array,
            required: true
        }
    },
	data: function () {
        return {
            activeListingFilters: [
				[ isDoc, false ]
			],
			showAllListings: false,
        }
    },
	computed: {
		sortedListings () {
			// Sort listings by date
			return this.listings
				.map( listing => new MappedListing( listing ) )
				.filter( matchesFilters( this.activeListingFilters ) )
				.sort( byListingDate )
				.reverse()
		}, 
		upcomingListings () {
			// console.log( 'listings', this.listings )

			const filters = [
				[ isUpcoming, true ],
				[ isDoc, false ]
			]

			return this.sortedListings.filter( matchesFilters( filters )  )
		},
		nextUpcomingListing () {
			return this.upcomingListings[0]
		}
	}, 
	methods: {
		async scrollToUpcomingListing () {
			// console.log('nextUpcomingListing', this.nextUpcomingListing)

			const { elementId } = this.nextUpcomingListing
			const [ elementRef ] = this.$refs[ elementId ]
			const elementNode = elementRef.$el

			// Instant scroll to element before 
			// so we can setup a small scroll animation
			// this.$refs.row.scrollLeft = elementNode.previousElementSibling.offsetLeft - window.innerWidth + 275

			// Animate scroll to element before
			//  so that our whole column is visible
			await scrollIntoView( elementNode.previousElementSibling.previousElementSibling , {
				scrollMode: 'always',
				behavior: 'smooth', 
				block: 'start',
				inline: 'start',
				duration: 1500
			})
		},

		isListingNextUpcoming ( listing ) {
			return listing.elementId === this.nextUpcomingListing.elementId
		},

		visibilityClass ( listing ) {
			// const { elementId } = listing
			// const [ elementRef ] = this.$refs[ elementId ]
			// const elementNode = elementRef.$el

			// Show our upcoming listing first
			if ( listing.elementId === this.nextUpcomingListing.elementId ) {
				return ''
			}

			return this.showAllListings ? '' : 'opacity-0'
		},
		
		// Scrolls by window width time ratio
		scroll ( ratio ) {
			const windowWidth = window.innerWidth
			const scrollDistance = windowWidth * ratio

			this.$refs.row.scrollBy({ 
				// top: 100, // negative value acceptable
				left: scrollDistance, 
				behavior: 'smooth' 
			})
		}
	}, 
	mounted () {
		// Reveal all listings after a delay
		setTimeout( () => {
			this.showAllListings = true
		}, 1000 )
		
		this.scrollToUpcomingListing()
	}
}
</script>
