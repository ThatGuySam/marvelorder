import fs from 'fs-extra'


function updateMarkdownContent ( options:any = {} ) {
    const {
        sourceMarkdown, 
        newMarkdown,
        markerString
    } = options

    const startMarker = `<!-- start-${ markerString } -->`
    const endMarker = `<!-- end-${ markerString } -->`

    // Throw if start marker is not found
    

    const startIndex = sourceMarkdown.indexOf( startMarker ) + startMarker.length
    const endIndex = sourceMarkdown.indexOf( endMarker )

    const newReadmeListContent = [
        sourceMarkdown.slice( 0, startIndex ),
        newMarkdown,
        sourceMarkdown.slice( endIndex )
    ].join('')

    return newReadmeListContent
}

// function makeUpcomingListingsMarkdown ( upcomingListings: Listing[] ) {
// }



export async function updateReadmeListContent ( newListMardown: string, markerString: string ) {

    // Get README.md content
    const readmeContent = await fs.readFile( './README.md', 'utf8' )

    // console.log( 'readmeContent', readmeContent )

    const newReadmeListContent = updateMarkdownContent({
        sourceMarkdown: readmeContent,
        newMarkdown: newListMardown,
        markerString
    })

    // console.log( 'newReadmeListContent', newReadmeListContent )

    await fs.writeFile( './README.md', newReadmeListContent )

    return newReadmeListContent
}