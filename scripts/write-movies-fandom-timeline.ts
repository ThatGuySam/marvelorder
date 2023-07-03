import 'dotenv/config'

// @ts-expect-error
import { saveMoviesFandomTimeline } from '~/src/helpers/node/movies-fandom-timeline.ts'

;

( async () => {
    await saveMoviesFandomTimeline()

    process.exit()
} )()
