module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
            zIndex: {
                'top-nav': '1000',
                'overlay-nav': '900',
            }
        },
	},
	plugins: [ require('daisyui') ]
}
