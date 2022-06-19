import fs from 'fs-extra'


export async function updateReadmeListContent ( newListMardown: string, markerString: string ) {
    const startMarker = `<!-- start-${ markerString } -->`
    const endMarker = `<!-- end-${ markerString } -->`


    // Get README.md content
    const readmeContent = await fs.readFile( './README.md', 'utf8' )

    console.log( 'readmeContent', readmeContent )

    const startIndex = readmeContent.indexOf( startMarker ) + startMarker.length
    const endIndex = readmeContent.indexOf( endMarker )

    const newReadmeListContent = readmeContent.slice( 0, startIndex ) + newListMardown + readmeContent.slice( endIndex )

    console.log( 'newReadmeListContent', newReadmeListContent )

    await fs.writeFile( './README.md', newReadmeListContent )

    return newReadmeListContent
}