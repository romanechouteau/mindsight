import { inRange } from 'lodash'
import { WORLDBUILDER_MAX_VALUE } from '../../js/constants';

interface drawLineConfig {
    steps: number;
    opacity: number;
    waveLength: number;
    speed: number;
    offset: number;
    height: number;
    widthReductor: number;
}

export function drawLine(ctx, width, height, config) {
    ctx.save()
    ctx.translate(0.5, height/2)
    ctx.translate(0.5, 0.5);
    ctx.beginPath()
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    ctx.shadowBlur = 3
    ctx.shadowColor = 'white'
    ctx.strokeStyle = `rgba(255, 255, 255, ${config.opacity})`
    const inflexionPoint = (this.rangeValue.value) / WORLDBUILDER_MAX_VALUE
    // const sineLimits = [ Math.max(inflexionPoint - 0.5, 0), Math.min(inflexionPoint + 0.5, 1) ]
    const sineLimits = [ 0, 1 ]
    for (let x = 0; x < config.steps; x++) {
        const inflexionPointDistance = Math.abs(inflexionPoint - (x/config.steps));
        // debugger;
        let y = 0
        if (inRange(x/config.steps, sineLimits[0], sineLimits[1]))
            y = Math.sin((x - sineLimits[0]) * 1/(sineLimits[1] - sineLimits[0]) * ((Math.PI)/2) / config.waveLength + this.time.elapsed/config.speed + config.offset) * Math.sin(this.time.elapsed/config.speed) * Math.max((1 - inflexionPointDistance * config.widthReductor), 0)
        ctx.lineTo( x/config.steps * width, y * config.height )
    }
    ctx.stroke()
    ctx.closePath()
    ctx.restore()
}