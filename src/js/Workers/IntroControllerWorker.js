import { drawWave } from '../Tools/canvasUtils'

let canvas, ctx, configs

function setCanvas(_canvas) {
    canvas = _canvas
    ctx = canvas.getContext('2d')
}

function setConfigs(_configs) {
    configs = _configs
}

function _drawWave(elapsed) {
    const {width, height} = canvas
    ctx.clearRect(0, 0, width, height)
    drawWave(ctx, width, height, configs[0], elapsed)
    drawWave(ctx, width, height, configs[1], elapsed)
    drawWave(ctx, width, height, configs[2], elapsed)
}

self.addEventListener('message', message => {
    if (message.data.canvas) setCanvas(message.data.canvas)
    if (message.data.configs) setConfigs(message.data.configs)
    if (message.data.action === 'addWave') addWave(message.data.evtNameSpace)
    if (message.data.action === 'drawWave') _drawWave(message.data.elapsed)
})