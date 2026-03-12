export type LayoutDirection = 'start' | 'end'

export interface LayoutModes {
    outer: LayoutDirection
    inner: LayoutDirection
}

export function getLayoutModes ( itemIndex: number ): LayoutModes {
    // Get the layout mode
    const modeNumber = itemIndex % 4

    const outerModes: Record<number, LayoutDirection> = {
        1: 'start',
        2: 'end',
        3: 'start',
        0: 'end',
    }

    const innerModes: Record<number, LayoutDirection> = {
        1: 'start',
        2: 'end',
        3: 'end',
        0: 'start',
    }

    return {
        outer: outerModes[ modeNumber ],
        inner: innerModes[ modeNumber ],
    }
}
