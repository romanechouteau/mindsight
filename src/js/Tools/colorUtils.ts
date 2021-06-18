export const toRGBPercent = (color) => {
    const r = ((color / 256 / 256) % 256) / 255.
    const g = ((color / 256) % 256) / 255.
    const b = ((color) % 256) / 255.
    return [r, g, b]
}

export const toRGB = (color) => {
    const r = ((color / 256 / 256) % 256)
    const g = ((color / 256) % 256)
    const b = ((color) % 256)
    return [r, g, b]
}

export const mix = (color1, color2, percentage, to255?) => {
    return color1.map((val, i) => {
        const color = val * (1 - percentage) + color2[i] * percentage
        return to255 ? Math.round(color * 255) : color
    })
}