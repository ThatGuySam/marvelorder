import 'dotenv/config'

// @ts-ignore
import { saveMoviesFandomTimeline } from '~/src/helpers/node/movies-fandom-timeline.ts'


;(async () => {

    await saveMoviesFandomTimeline()

    process.exit()
})()
