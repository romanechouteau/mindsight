export default class PubSub {
    events: {
      [key: string]: any
    }
    constructor() {
      this.events = {}
    }

    // subscribe to changes
    subscribe(event, callback) {
        if(!this.events.hasOwnProperty(event)) {
            this.events[event] = []
        }

        return this.events[event].push(callback)
    }

    // publish changes
    publish(event, data = {}) {
        if(!this.events.hasOwnProperty(event)) {
          return []
        }

        return this.events[event].map(callback => callback(data))
      }
  }