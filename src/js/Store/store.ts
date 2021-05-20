// @ts-ignore
import PubSub from '@lib/pubsub'

export default class Store {
    state: {
        [key: string]: any
    }
    status: string
    events: PubSub
    actions: {
        [key: string]: Function
    }
    mutations: {
        [key: string]: Function
    }
    constructor(params: { actions?: {}, mutations?: {}, state?: {} }) {
        const { actions, mutations, state } = params

        this.actions = actions ?? {}
        this.mutations = mutations ?? {}
        this.state = {}
        this.status = 'resting'
        this.events = new PubSub()

        this.state = new Proxy((state || {}), {
            set: (state, key, value) => {
                state[key] = value

                console.log(`stateChange: ${String(key)}: ${value}`)

                this.events.publish('stateChange', this.state)

                if (this.status !== 'mutation') {
                    console.warn(`You should use a mutation to set ${String(key)}`)
                }

                this.status = 'resting'

                return true
            }
        })
    }

    dispatch(actionKey, payload) {
        if (typeof this.actions[actionKey] !== 'function') {
          console.error(`Action "${actionKey} doesn't exist.`)
          return false
        }

        console.groupCollapsed(`ACTION: ${actionKey}`)

        this.status = 'action'

        this.actions[actionKey](this, payload)

        console.groupEnd()

        return true
    }

    commit(mutationKey, payload) {
        if(typeof this.mutations[mutationKey] !== 'function') {
          console.log(`Mutation "${mutationKey}" doesn't exist`)
          return false
        }

        this.status = 'mutation'

        const newState = this.mutations[mutationKey](this.state, payload)

        this.state = Object.assign(this.state, newState)

        return true
    }
  }