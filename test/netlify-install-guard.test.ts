import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

const repoRoot = path.resolve( import.meta.dirname, '..' )
const packageJsonPath = path.join( repoRoot, 'package.json' )
const packageJson = JSON.parse( readFileSync( packageJsonPath, 'utf8' ) ) as {
    engines?: Record<string, string>
    packageManager?: string
}

describe( 'Netlify install guard', () => {
    test( 'keeps Bun detection compatible with Netlify builds', () => {
        expect( packageJson.packageManager ).toBeUndefined()
        expect( packageJson.engines?.bun ).toBeTruthy()
        expect( existsSync( path.join( repoRoot, 'bun.lockb' ) ) ).toBe( true )
    } )

    test( 'does not commit conflicting lockfiles for other package managers', () => {
        expect( existsSync( path.join( repoRoot, 'package-lock.json' ) ) ).toBe( false )
        expect( existsSync( path.join( repoRoot, 'pnpm-lock.yaml' ) ) ).toBe( false )
        expect( existsSync( path.join( repoRoot, 'yarn.lock' ) ) ).toBe( false )
    } )
} )
