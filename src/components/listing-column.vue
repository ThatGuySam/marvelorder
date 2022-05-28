<template>
	<article 
		class="listing-card w-full flex-shrink-0 flex-grow-0" 
		:style="{ 
			maxWidth: `${ width }px`, 
			flexBasis: `${ width }px`, 
			scrollSnapAlign: 'end' 
		}"
	>
		<a :href="listing.endpoint" class="">
			<div 
				:class="[`listing-card-container flex gap-8 ${ outerDirection } h-screen justify-${ modes.outer }`]"
			>
				<div 
					:class="[ `inner-container flex ${ outerDirection } h-full w-full justify-end` ]"
				>

					<div class="inner-container relative py-16">
						<div 
							:class="`listing-card-content absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center`"
							:style="{ width: `${ markWidth }px` }"
						>
							<h2 class="w-full text-3xl test-white font-bold text-center whitespace-normal">{{ title }}</h2>
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

import { getLayoutModes } from '../helpers/layout.ts'

export default {
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
			default: 325
		}, 
		width: {
			type: Number,
			default: 100
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
			return this.modes.inner === 'start' ? 'h-full' : 'h-1/4'
		},
    }
    // data: function () {
    //     return {
    //         // isOpen: false
    //     }
    // }
}
</script>
