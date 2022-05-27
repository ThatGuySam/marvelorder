import { assert, expect, test } from 'vitest'

// @ts-ignore
import { getLayoutMode } from '../src/helpers/layout.ts'


test('Math.sqrt()', () => {


    expect( getLayoutMode(1) ).toBe( 'upper-top' )
    expect( getLayoutMode(2) ).toBe( 'lower-bottom' )
    expect( getLayoutMode(3) ).toBe( 'upper-mid' )
    expect( getLayoutMode(4) ).toBe( 'lower-mid' )
    expect( getLayoutMode(5) ).toBe( 'upper-top' )
    expect( getLayoutMode(6) ).toBe( 'lower-bottom' )
    expect( getLayoutMode(7) ).toBe( 'upper-mid' )
    expect( getLayoutMode(8) ).toBe( 'lower-mid' )
    expect( getLayoutMode(9) ).toBe( 'upper-top' )
    expect( getLayoutMode(10) ).toBe( 'lower-bottom' )
})