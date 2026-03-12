export function isString ( maybeString: unknown ): maybeString is string | String {
    return ( typeof maybeString === 'string' || maybeString instanceof String )
}

export function isNonEmptyString ( maybeString: unknown ) {
    if ( !isString( maybeString ) ) {
        return false
    }

    return maybeString.length > 0
}

export function isNonEmptyArray ( maybeArray: unknown ) {
    if ( !Array.isArray( maybeArray ) ) {
        return false
    }

    return maybeArray.length > 0
}

export function isPositiveNumberString ( maybeNumber: unknown ) {
    if ( !isString( maybeNumber ) ) {
        return false
    }

    return /\d+$/.test( String( maybeNumber ) )
}

export function isValidHttpUrl ( maybeUrl: unknown, allowUnsecure = false ) {
    if ( !isString( maybeUrl ) ) {
        return false
    }

    let url: URL

    try {
        url = new URL( String( maybeUrl ) )
    }
    catch ( _ ) {
        return false
    }

    if ( allowUnsecure ) {
        return url.protocol === 'http:' || url.protocol === 'https:'
    }

    return url.protocol === 'https:'
}

export function isValidImageUrl ( maybeUrl: unknown ) {
    if ( !isValidHttpUrl( maybeUrl ) ) {
        return false
    }

    // Check if url has a file extension
    const url = new URL( String( maybeUrl ) )
    const fileExtension = url.pathname.split( '.' ).pop()

    return isNonEmptyString( fileExtension )
}

export function isObject ( maybeObject: unknown ) {
    return maybeObject === Object( maybeObject )
}
