import fs from 'node:fs'

import { expect, test } from 'vitest'

test( 'The retired Punisher URL redirects to the renamed listing', () => {
    const netlifyConfig = fs.readFileSync( 'netlify.toml', 'utf8' )

    expect( netlifyConfig ).toContain( `[[redirects]]
    from = "/en/untitled-the-punisher-special-1439930"
    to = "/en/the-punisher-one-last-kill-1657196"
    status = 301
    force = true` )
} )
