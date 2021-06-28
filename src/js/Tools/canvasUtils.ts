import { inRange } from 'lodash'
import Time from './Time'

export interface drawWaveConfig {
    steps: number;
    opacity: number;
    waveLength: number;
    speed: number;
    offset: number;
    height: number;
    widthReductor: number;
    inflexionPoint?: number;
}

export const waveBaseConfig = {
    steps: 200,
    opacity: 1,
    waveLength: 50,
    speed: 1500,
    offset: 0,
    height: 200,
    widthReductor: 1.2,
    inflexionPoint: 0
}

// draw intro animation waves
export function drawWave(ctx: CanvasRenderingContext2D, width: number, height: number, config: drawWaveConfig, _time?: Time|number) {
    const time = this?.time ?? _time
    let elapsed
    if (typeof(time) === 'number') elapsed = time
    else elapsed = time.elapsed
    ctx.save()
    ctx.translate(0.5, height/2)
    ctx.translate(0.5, 0.5);
    ctx.beginPath()
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 7
    ctx.shadowColor = 'white'
    ctx.strokeStyle = `rgba(255, 255, 255, ${config.opacity})`
    ctx.lineWidth = 2
    const sineLimits = [ 0, 1 ]
    for (let x = 0; x < config.steps; x++) {
        const ip = config.inflexionPoint
        const inflexionPointDistance = Math.abs(ip - (x/config.steps))
        let y = 0
        if (inRange(x/config.steps, sineLimits[0], sineLimits[1]))
            y = Math.sin((x - sineLimits[0]) * 1/(sineLimits[1] - sineLimits[0]) * ((Math.PI)/2) / config.waveLength + elapsed/config.speed + config.offset) * Math.sin(elapsed/config.speed) * Math.max((1 - inflexionPointDistance * Math.exp(inflexionPointDistance * config.widthReductor)), 0)
        ctx.lineTo( x/config.steps * width, y * config.height )
    }
    ctx.stroke()
    ctx.closePath()
    ctx.restore()
}