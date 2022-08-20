import 'dotenv/config'

import {
    ensureFiltersHaveStories
// @ts-ignore
} from '~/src/helpers/node/markdown-files.ts'


;(async () => {

    await ensureFiltersHaveStories()

    process.exit()
})()
