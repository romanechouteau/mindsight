import { inRange } from 'lodash'
import Time from './Time';

export interface drawWaveConfig {
    steps: number;
    opacity: number;
    waveLength: number;
    speed: number;
    offset: number;
    height: number;
    widthReductor: number;
}

export const waveBaseConfig = { 
    steps: 200, 
    opacity: 1, 
    waveLength: 50, 
    speed: 250, 
    offset: 0, 
    height: 50, 
    widthReductor: 3 
}

// TODO: refactor params
export function drawWave(ctx: CanvasRenderingContext2D, width: number, height: number, config: drawWaveConfig, inflexionPoint = 0.5, _time?: Time) {
    const time = this?.time ?? _time
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
    // const sineLimits = [ Math.max(inflexionPoint - 0.5, 0), Math.min(inflexionPoint + 0.5, 1) ]
    const sineLimits = [ 0, 1 ]
    for (let x = 0; x < config.steps; x++) {
        const inflexionPointDistance = Math.abs(inflexionPoint - (x/config.steps));
        // debugger;
        let y = 0
        if (inRange(x/config.steps, sineLimits[0], sineLimits[1]))
            y = Math.sin((x - sineLimits[0]) * 1/(sineLimits[1] - sineLimits[0]) * ((Math.PI)/2) / config.waveLength + time.elapsed/config.speed + config.offset) * Math.sin(time.elapsed/config.speed) * Math.max((1 - inflexionPointDistance * config.widthReductor), 0)
        ctx.lineTo( x/config.steps * width, y * config.height )
    }
    ctx.stroke()
    ctx.closePath()
    ctx.restore()
}