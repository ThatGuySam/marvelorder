<template>
	<article 
		class="listing-card w-full flex-shrink-0 flex-grow-0 snap-end" 
		:style="{ 
			maxWidth: `${ width }px`, 
			flexBasis: `${ width }px`, 
		}"
	>
		<a :href="listing.endpoint" class="">
			<div 
				:class="[
					`listing-card-container flex gap-8 ${ outerDirection } h-screen justify-${ modes.outer }`,
				]"
			>
				<div 
					:class="[ 
						`inner-container flex ${ outerDirection } h-full w-full justify-end`, 
						'transition-opacity ease-in-out duration-750', 
						visibilityClass
					]"
				>

					<div class="inner-container relative py-16">
						<div 
							:class="`listing-card-content absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center`"
							:style="{ width: `${ markWidth }px` }"
						>
							<!-- <div class="bg-green-600 absolute inset-0" /> -->
							<template v-if="logo">
								<ListingLogo 
									:src="logo"
									class="w-full h-full object-contain relative max-h-28"
									:alt="title"
								/>
							</template>
							<h2 
								v-else
								class="w-full text-3xl test-white font-bold text-center whitespace-normal"
							>{{ title }}</h2>
						</div>
					</div>

					<div 
						:class="`vertical-line-container relative flex gap-4 ${ outerDirection } ${ innerHeight }`"
					>
						<div 
							:class="`vertical-line w-1 bg-current h-full`"
						/>
						<div class="w-32 text-center font-bold uppercase">
							{{ listing.dateHumanReadable }}
						</div>
					</div>

				</div>

				<div 
					:class="`center-line w-full border border-x-transparent border-y-white h-32`"
				/>

				<div 
					class="inner-container h-full"
				/>

			</div>
		</a>
	</article>


</template>

<script>

import { getLayoutModes } from '~/src/helpers/layout.ts'

import ListingLogo from './listing-logo.vue'

export default {
	components: {
		ListingLogo
	},
    props: {
        listing: {
            type: Object,
            required: true
        },
		index: {
			type: Number,
			required: true
		},
		markWidth: {
			type: Number,
			default: 275
		}, 
		width: {
			type: Number,
			default: 100
		},
		visibilityClass: {
			type: String,
			default: ''
		}
    },
    computed: {
		title () {
			return this.listing.title
		}, 
		modes () {
			return getLayoutModes( this.index )
		},
		outerDirection () {
			return this.modes.outer === 'start' ? 'flex-col' : 'flex-col-reverse'
		},
		// innerDirection () {
		// 	return this.modes.inner === 'start' ? 'flex-col' : 'flex-col-reverse'
		// },
		innerHeight () {
			return this.modes.inner === 'start' ? 'h-1/2' : 'h-1/5'
		},
		logo () {
			return this.listing?.logo_on_black
		}
    }
    // data: function () {
    //     return {
    //         // isOpen: false
    //     }
    // }
}
</script>
