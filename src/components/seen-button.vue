<template>
    <SimpleButton
        class="group" :class="[
            seenListing ? 'group-hover:bg-white group-hover:text-black border-opacity-0' : 'opacity-0 group-hover:opacity-100',
        ]"

        @click="toggleSeen()"
    >
        <div
            class="hidden group-hover:block overflow-hidden"
        >
            {{ label }}
        </div>
        <div>
            <svg
                v-if="seenListing"
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
            >
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1"
            >
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
    </SimpleButton>
</template>

<script>
import localforage from 'localforage'

import SimpleButton from './button.vue'

export default {
    components: {
        SimpleButton,
    },
    props: {
        listing: {
            type: Object,
            required: true,
        },
    },
    emits: [
        'toggleSeen',
    ],
    data () {
        return {
            localforageReady: false,
            seenListing: false,
        }
    },
    computed: {
        label () {
            return this.seenListing ? 'Seen' : 'Mark as Seen'
        },
    },
    mounted () {
        localforage.ready()
            .then( () => {
                this.localforageReady = true

                return this.getSeen()
            } )
            .then( ( item ) => {
                // console.log('item', item)
                this.seenListing = item
            } )
    },
    methods: {
        async getSeen () {
            const initialState = await localforage.getItem( `seen-${ this.listing.id }` )

            return initialState
        },
        async toggleSeen () {
            const initialState = await this.getSeen()

            await localforage.setItem( `seen-${ this.listing.id }`, !initialState )

            const newState = await this.getSeen()

            this.seenListing = newState

            this.$emit( 'toggleSeen', this.listing )
        },
    },
}
</script>
