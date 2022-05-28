<template>

	<div class="listing-row relative fill-height w-screen">

		<div 
			class="listing-row-contents flex overflow-x-auto whitespace-no-wrap" 
			style="scroll-snap-type: x mandatory;"
		>

			<div class="start-cap w-full flex-shrink-0 max-w-xs" />

			<template
				v-for="( listing, index ) in sortedListings"
				:key="index"
			>
				<ListingColumn 
					:listing="listing"
					:index="index"
				/>
			</template>

			<div class="end-cap  w-full flex-shrink-0 max-w-xs snap-end" />

		</div>

		<!-- <button class="absolute left-0 h-10 w-10 flex justify-center items-center transform -translate-y-1/2 -translate-x-1/2 bg-darker rounded-full" style="top:50%;" distance="-325" scroll-target="#row-adn9shse7" onclick="scrollHorizontalCarousel( event )" aria-label="Scroll to previous listings">
			<svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5 text-gray-400" style="transform: scaleX(-1);">
				<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
			</svg>
		</button>
		<button class="absolute right-0 h-10 w-10 flex justify-center items-center transform -translate-y-1/2 translate-x-1/2 bg-darker rounded-full" style="top:50%;" distance="325" scroll-target="#row-adn9shse7" onclick="scrollHorizontalCarousel( event )" aria-label="Scroll to next listings">
			<svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5 text-gray-400">
				<path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
			</svg>
		</button> -->

	</div>

</template>

<script>

import { byListingDate } from '~/src/helpers/sort.ts'
import { MappedListing } from '~/src/helpers/node/listing.ts'

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
	computed: {
		sortedListings () {
			// Sort listings by date
			return this.listings
				.map( listing => new MappedListing( listing ) )
				.sort( byListingDate )
				.reverse()
		}, 
		upcomingListing () {
			console.log( 'listings', this.listings )
			return this.listings.filter( listing => {
				if ( listing?.date ) return true
				
				// return new Date() - listing.date > 0
			} )
		}
	}, 
    // data: function () {
    //     return {
    //         // isOpen: false
    //     }
    // }
	mounted () {
		// Find closest upcoming listing in the future
		// const upcomingListing = listings.find( listing => listing.date > new Date() )
		// arr.filter(function(d) {
		//     return d - diffdate > 0;
		// })

		console.log('upcomingListing', this.upcomingListing)
	}
}
</script>
