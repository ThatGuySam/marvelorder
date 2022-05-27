export function getLayoutMode ( itemIndex ) {
    // Get the layout mode
    const modeNumber = itemIndex % 4

    const modes = {
        1: 'upper-top',
        2: 'lower-bottom',
        3: 'upper-mid',
        0: 'lower-mid',
    }

    return modes[ modeNumber ]
}