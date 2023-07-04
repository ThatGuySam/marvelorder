const excludedUrls = new Set( [
    'google.com',
    'sitemaps.org',
    'w3.org',
    'schema.org',
] )

// Fetch urls from a sitemap.xml file
export async function fetchSitemapUrls ( sitemapUrl: string ): Promise<string[]> {
    const response = await fetch( sitemapUrl )
    const text = await response.text()

    // Find all urls in the sitemap
    const urls = text
        // Replace all left and right brackets
        .replace( /</g, ' ' )
        .replace( />/g, ' ' )
        // Match all urls
        .match( /((http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(\/\S*)?)/g )
        // Filter out common sitemap reference urls
        .filter( url => !excludedUrls.has( url ) )

    return urls
}
