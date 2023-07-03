import 'dotenv/config'

import {
    ensureFiltersHaveStories,
// @ts-expect-error
} from '~/src/helpers/node/markdown-files.ts'

;

( async () => {
    await ensureFiltersHaveStories()

    process.exit()
} )()
