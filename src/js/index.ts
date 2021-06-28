import '@style/style.styl'
// @ts-ignore
import App from '@js/App'
import FrontRouter from './Routing/router'

// @ts-ignore
window.onNavClick = (pathName) => {
  FrontRouter.onNavClick(pathName)
}

// @ts-ignore
window.App = new App({
  canvas: document.querySelector('#_canvas'),
})
