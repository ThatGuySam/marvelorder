type ReadyDocument = Pick<Document, 'addEventListener' | 'readyState'>

export function makeScrollableCodeFocusable (documentRef: Document = document): void {
    Array.from( documentRef.getElementsByTagName( 'pre' ) ).forEach( (element) => {
        element.tabIndex = 0
    } )
}

export function runWhenDocumentReady (
    callback: () => void,
    documentRef: ReadyDocument = document,
): void {
    if ( documentRef.readyState === 'loading' ) {
        documentRef.addEventListener( 'DOMContentLoaded', callback, { once: true } )
        return
    }

    callback()
}
