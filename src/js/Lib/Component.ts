import { isUndefined } from 'lodash'

// @ts-ignore
import Store from '@store/store'

export default class Component {
  render: Function
  element: HTMLElement
  constructor(props: { store?: Store, element?: any }) {
    const { store, element } = props

    this.render = this.render || function() {}

    if (store instanceof Store) {
      store.events.subscribe('stateChange', () => this.render())
    }

    if(!isUndefined(element)) {
      this.element = element
    }
  }
}