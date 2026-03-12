import { defineConfig } from 'tinacms'

// Your hosting provider likely exposes this as an environment variable
const branch
  = process.env.GITHUB_BRANCH
  || process.env.VERCEL_GIT_COMMIT_REF
  || process.env.HEAD
  || 'main'

export default defineConfig( {
    branch,

    // Get this from tina.io
    clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
    // Get this from tina.io
    token: process.env.TINA_TOKEN,

    build: {
        outputFolder: 'admin',
        publicFolder: 'public',
    },
    media: {
        tina: {
            mediaRoot: '',
            publicFolder: 'public',
        },
    },
    // See docs on content modeling for more info on how to setup new content models: https://tina.io/docs/schema/
    schema: {
        collections: [
            {
                name: 'listing',
                label: 'Listings',
                path: 'src/pages/en',
                fields: [
                    {
                        type: 'string',
                        name: 'title',
                        label: 'Title',
                        isTitle: true,
                        required: true,
                    },
                    { name: 'logo_on_black', label: 'Logo on Black', type: 'string', required: false },
                    { name: 'draft', label: 'Draft', type: 'boolean', required: false },
                    { name: 'mcuTimelineOrder', label: 'MCU Timeline Order', type: 'number', required: false },
                    { name: 'adult', label: 'Adult Content', type: 'boolean', required: false },
                    { name: 'backdrop_path', label: 'Backdrop Path', type: 'string', required: false },
                    { name: 'genre_ids', label: 'Genre IDs', type: 'number', required: false, list: true },
                    // { name: 'id', label: 'ID', type: 'number', required: false },
                    { name: 'original_language', label: 'Original Language', type: 'string', required: false },
                    { name: 'original_title', label: 'Original Title', type: 'string', required: false },
                    { name: 'overview', label: 'Overview', type: 'string', required: false },
                    { name: 'poster_path', label: 'Poster Path', type: 'string', required: false },
                    { name: 'release_date', label: 'Release Date', type: 'datetime', required: false },
                    { name: 'video', label: 'Video', type: 'boolean', required: false },
                    { name: 'vote_average', label: 'Vote Average', type: 'number', required: false },
                    { name: 'slug', label: 'Slug', type: 'string', required: false },
                    { name: 'tags', label: 'Tags', type: 'string', required: false, list: true },
                ],
            },
        ],
    },
} )
