const trim = (str, chars) => str.split(chars).filter(Boolean).join(chars);


export function makeFunctionUrlFromTmdb ( tmdbImagePath ) {
    const [ tmdbImageId ] = (trim(tmdbImagePath, ['/'] )).split('.')

    return `/.netlify/functions/tmdb-image/${ tmdbImageId }.webp`
}

export function getListingLogoUrl ( listing ) {
    const { 
        logo_on_black = null
    } = listing

    if ( !logo_on_black ) return null

    return logo_on_black
}