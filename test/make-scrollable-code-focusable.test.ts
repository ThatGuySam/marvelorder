import { JSDOM } from 'jsdom'
import { expect, test, vi } from 'vitest'

import {
    makeScrollableCodeFocusable,
    runWhenDocumentReady,
} from '~/src/helpers/make-scrollable-code-focusable.ts'

test( 'Can make code blocks keyboard focusable', () => {
    const dom = new JSDOM( '<pre>one</pre><pre tabindex="-1">two</pre><div>three</div>' )

    makeScrollableCodeFocusable( dom.window.document )

    const [ first, second ] = Array.from( dom.window.document.getElementsByTagName( 'pre' ) )

    expect( first.getAttribute( 'tabindex' ) ).toBe( '0' )
    expect( second.getAttribute( 'tabindex' ) ).toBe( '0' )
} )

test( 'Can defer the helper until DOMContentLoaded', () => {
    const callback = vi.fn()
    const documentRef = {
        readyState: 'loading',
        addEventListener: vi.fn(),
    } as unknown as Document

    runWhenDocumentReady( callback, documentRef )

    expect( callback ).not.toHaveBeenCalled()
    expect( documentRef.addEventListener ).toHaveBeenCalledWith(
        'DOMContentLoaded',
        callback,
        { once: true },
    )
} )

test( 'Can run the helper immediately after the document has loaded', () => {
    const callback = vi.fn()
    const documentRef = {
        readyState: 'complete',
        addEventListener: vi.fn(),
    } as unknown as Document

    runWhenDocumentReady( callback, documentRef )

    expect( callback ).toHaveBeenCalledTimes( 1 )
    expect( documentRef.addEventListener ).not.toHaveBeenCalled()
} )
