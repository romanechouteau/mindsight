export const toRGBPercent = (color: number) => {
    const r = ((color / 256 / 256) % 256) / 255.
    const g = ((color / 256) % 256) / 255.
    const b = ((color) % 256) / 255.
    return [r, g, b]
}

export const toRGB = (color: number) => {
    const r = ((color / 256 / 256) % 256)
    const g = ((color / 256) % 256)
    const b = ((color) % 256)
    return [r, g, b]
}

export const toHexInt = (color: number[]) => {
    const hex = color.reduce((acc, val) => `${acc}${Math.floor(val).toString(16)}`, '')
    return parseInt(hex, 16)
}

export const mix = (color1: number[], color2: number[], percentage: number, to255?: boolean) => {
    return color1.map((val, i) => {
        const color = val * (1 - percentage) + color2[i] * percentage
        return to255 ? Math.round(color * 255) : color
    })
}