<template>
    <component
        :is="tagName"
        :class="[
            'flex justify-center items-center w-16 hover:w-20 aspect-square bg-black/25 backdrop-blur rounded-full border border-solid border-white',
            'transition-all duration-200 ease-in-out',
        ]"
    >
        <slot />
    </component>
</template>
<script>

export default {
    props: {
        tagName: {
            type: String,
            default: 'button'
        }
    }
}
</script>
