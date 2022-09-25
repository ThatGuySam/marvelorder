export function trimCharacter ( str, chars ) {
    return str.split(chars).filter(Boolean).join(chars)
}
