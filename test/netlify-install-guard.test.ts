import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

const repoRoot = path.resolve( import.meta.dirname, '..' )
const packageJsonPath = path.join( repoRoot, 'package.json' )
const bunLockPath = path.join( repoRoot, 'bun.lock' )
const packageJson = JSON.parse( readFileSync( packageJsonPath, 'utf8' ) ) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    engines?: Record<string, string>
    packageManager?: string
}
const bunLock = readFileSync( bunLockPath, 'utf8' )

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

    test( 'includes node-gyp when the lockfile needs better-sqlite3', () => {
        if ( !bunLock.includes( '"better-sqlite3"' ) ) {
            return
        }

        expect(
            packageJson.dependencies?.['node-gyp']
            || packageJson.devDependencies?.['node-gyp'],
        ).toBeTruthy()
    } )
} )
