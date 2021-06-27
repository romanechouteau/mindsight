import { drawWave, waveBaseConfig } from "../Tools/canvasUtils"

export default function initAbout() {
    const canvas = (document.querySelector('.about canvas#lines') as HTMLCanvasElement)
    const ctx = canvas.getContext('2d')
    const {width, height} = canvas
    const config = {...waveBaseConfig, speed: 800, height: 100, opacity: 0.3}
    const config2 = {...waveBaseConfig,
        steps: 200,
        opacity: 0.2,
        waveLength: 25,
        speed: 650,
        offset: 10,
        height: 100,
        widthReductor: 3,
        inflexionPoint: 0.5}
    let start = Date.now()
    let elapsed = 0
    const animate = () => {
        elapsed = Date.now() - start
        ctx.clearRect(0, 0, width, height)
        drawWave(ctx, width, height, config, elapsed )
        drawWave(ctx, width, height, config2, elapsed )
        setTimeout(() => {
            requestAnimationFrame(animate)
        }, 1000 / 60)
    }
    animate()
}