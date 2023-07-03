import 'dotenv/config'

import {
    ensureFiltersHaveStories,
} from '~/src/helpers/node/markdown-files.ts'

;

( async () => {
    await ensureFiltersHaveStories()

    process.exit()
} )()
