export function getLayoutModes ( itemIndex ) {
    // Get the layout mode
    const modeNumber = itemIndex % 4

    const outerModes = {
        1: 'start',
        2: 'end',
        3: 'start',
        0: 'end',
    }

    const innerModes = {
        1: 'start',
        2: 'end',
        3: 'end',
        0: 'start',
    }

    return { 
        outer: outerModes[modeNumber], 
        inner: innerModes[modeNumber]
    }
}