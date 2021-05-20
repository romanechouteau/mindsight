import '@style/style.styl'
// @ts-ignore
import App from '@js/App'

// @ts-ignore
// import store from '@store/index'
import store from '../js/Store/index'

// store.events.subscribe('stateChange', () => {
//   if (store.state.isIntro) {
    
//   }
// })

// @ts-ignore
window.App = new App({
  canvas: document.querySelector('#_canvas'),
})
