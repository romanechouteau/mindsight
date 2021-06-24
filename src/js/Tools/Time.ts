// Steal from https://github.com/brunosimon/folio-2019
import EventEmitter from './EventEmitter'

export default class Time extends EventEmitter {

  start: number;
  current: number;
  elapsed: number;
  delta: number;
  ticker?: number;
  
  constructor() {
    // Get parent methods
    super()

    // Set up
    this.start = Date.now()
    this.current = this.start
    this.elapsed = 0
    this.delta = 16

    this.tick = this.tick.bind(this)
    this.tick()
  }
  // on('tick')
  tick() {
    // Call tick method on each frame
    setTimeout(() => {
      this.ticker = window.requestAnimationFrame(this.tick)
      this.trigger('tick')
    }, 1000 / 60)

    // Get current time
    const current = Date.now()

    // delta
    this.delta = current - this.current
    this.elapsed = current - this.start
    this.current = current

    if (this.delta > 60) {
      this.delta = 60
    }
    // Add trigger event
    this.trigger('tick')
  }
  // Cancel animation frame
  stop() {
    if (this.ticker) window.cancelAnimationFrame(this.ticker)
  }
}
