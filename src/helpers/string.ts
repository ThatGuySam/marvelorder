export function trimCharacter ( str, character ) {
    let trimmed = str

    while ( character === trimmed[ 0 ] ) {
        trimmed = trimmed.slice( 1 )
    }

    while ( character === trimmed[ trimmed.length - 1 ] ) {
        trimmed = trimmed.slice( 0, trimmed.length - 1 )
    }

    return trimmed
}

export function trimCharacters ( str, chars ) {
    let trimmed = str

    while ( chars.includes( trimmed[ 0 ] ) ) {
        trimmed = trimmed.slice( 1 )
    }

    while ( chars.includes( trimmed[ trimmed.length - 1 ] ) ) {
        trimmed = trimmed.slice( 0, trimmed.length - 1 )
    }

    return trimmed
}
