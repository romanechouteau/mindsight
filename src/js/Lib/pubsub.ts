import { map, has } from 'lodash'

export default class PubSub {
    events: {
      [key: string]: any
    }
    constructor() {
      this.events = {}
    }

    subscribe(event, callback) {
        if(!has(this.events, event)) {
            this.events[event] = []
        }

        return this.events[event].push(callback)
    }

    publish(event, data = {}) {
        if(!has(this.events, event)) {
          return []
        }

        return map(this.events[event], callback => callback(data))
      }
  }