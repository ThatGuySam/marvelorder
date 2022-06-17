import fs from 'fs-extra'
import 'dotenv/config'
import axios from 'axios'

// @ts-ignore
import { storePath } from '~/src/config.ts'

const macroUrl = 'https://script.google.com/macros/s/AKfycbzGvKKUIaqsMuCj7-A2YRhR-f7GZjl4kSxSN1YyLkS01_CfiyE/exec'
const mcuTimelineSheetId = '1Xfe--9Wshbb3ru0JplA2PnEwN7mVawazKmhWJjr_wKs'

;(async () => {

    const sheet = await axios( macroUrl, {
        params: {
            id: mcuTimelineSheetId, 
            sheet: 'Chronological Order', 
            header: 1,
            startRow: 4
        }
    } ).then( res => res.data )

    // Write data to JSON
    await fs.writeFile( storePath + '/mcu-timeline-sheet.json', JSON.stringify( sheet, null, 2 ) )
    
    process.exit()
})()