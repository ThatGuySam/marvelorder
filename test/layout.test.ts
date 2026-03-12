import { expect, test } from 'vitest'

import { getLayoutModes } from '../src/helpers/layout.ts'

test( 'Layout mode follow correct order', () => {
    expect( getLayoutModes( 1 ) ).toEqual( { outer: 'start', inner: 'start' } )
    expect( getLayoutModes( 2 ) ).toEqual( { outer: 'end', inner: 'end' } )
    expect( getLayoutModes( 3 ) ).toEqual( { outer: 'start', inner: 'end' } )
    expect( getLayoutModes( 4 ) ).toEqual( { outer: 'end', inner: 'start' } )
    expect( getLayoutModes( 5 ) ).toEqual( { outer: 'start', inner: 'start' } )
    expect( getLayoutModes( 6 ) ).toEqual( { outer: 'end', inner: 'end' } )
    expect( getLayoutModes( 7 ) ).toEqual( { outer: 'start', inner: 'end' } )
    expect( getLayoutModes( 8 ) ).toEqual( { outer: 'end', inner: 'start' } )
    expect( getLayoutModes( 9 ) ).toEqual( { outer: 'start', inner: 'start' } )
    expect( getLayoutModes( 10 ) ).toEqual( { outer: 'end', inner: 'end' } )
} )
