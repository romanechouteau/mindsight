let canvas, ctx, bitmaps = []

function setCanvas(_canvas) {
    canvas = _canvas
    ctx = canvas.getContext('2d')
}

/**
 * 
 * @param {ImageBitmap} _bitmap 
 */
function pushBitmap(_bitmap) {
    bitmaps.push(_bitmap)
    ctx.drawImage(bitmaps[0], 0, 0)
}

function blend(options) {
    const { firstMapIndex, firstMapInfluence, secondMapIndex, secondMapInfluence } = options

    const firstMap = bitmaps[firstMapIndex], secondMap = bitmaps[secondMapIndex]
    let pixels = 4 * firstMap.width * firstMap.height
    ctx.drawImage(firstMap, 0, 0)
    const image1 = ctx.getImageData(0, 0, firstMap.width, firstMap.height)
    const imageData1 = image1.data
    ctx.drawImage(secondMap, 0, 0)
    const image2 = ctx.getImageData(0, 0, secondMap.width, secondMap.height)
    const imageData2 = image2.data
    while (pixels--) {
        imageData1[pixels] = imageData1[pixels] * firstMapInfluence + imageData2[pixels] * secondMapInfluence
    }
    image1.data.set(imageData1)
    ctx.putImageData(image1, 0, 0)
    self.postMessage({ event: 'update' })
}

self.addEventListener('message', message => {
    if (message.data.canvas) setCanvas(message.data.canvas)
    if (message.data.bitmap) pushBitmap(message.data.bitmap)
    if (message.data.action === 'blend') blend(message.data.options)
})