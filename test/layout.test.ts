import { assert, expect, test } from 'vitest'

// @ts-ignore
import { getLayoutModes } from '../src/helpers/layout.ts'


test('Layout mode follow correct order', () => {


    expect( getLayoutModes(1) ).toContain( { outer: 'start', inner: 'start' } )
    expect( getLayoutModes(2) ).toContain( { outer: 'end', inner: 'end' } )
    expect( getLayoutModes(3) ).toContain( { outer: 'start', inner: 'end' } )
    expect( getLayoutModes(4) ).toContain( { outer: 'end', inner: 'start' } )
    expect( getLayoutModes(5) ).toContain( { outer: 'start', inner: 'start' } )
    expect( getLayoutModes(6) ).toContain( { outer: 'end', inner: 'end' } )
    expect( getLayoutModes(7) ).toContain( { outer: 'start', inner: 'end' } )
    expect( getLayoutModes(8) ).toContain( { outer: 'end', inner: 'start' } )
    expect( getLayoutModes(9) ).toContain( { outer: 'start', inner: 'start' } )
    expect( getLayoutModes(10) ).toContain( { outer: 'end', inner: 'end' } )
})