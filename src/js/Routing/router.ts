//Declare the variables for home, about & contact html pages
// @ts-ignore
import aboutTemplate from '../../templates/pages/about.template'
import initAbout from './about'

class FrontRouter {
    root: HTMLDivElement
    routes: {
        '/': string
        '/#about': string
    }
    scripts: {
        '/': Function
        '/#about': Function
        '/#debug': Function
    }
    constructor() {
        this.root = document.querySelector('#routerRoot')
        this.routes = {
          '/': '',
          '/#about': aboutTemplate,
        }
        this.scripts = {
            '/': () => null,
            '/#about': initAbout,
            '/#debug': () => null
        }

        window.onload = () => {
            if (!this.noRouterContent()) {
                this.onNavClick('/' + window.location.hash)
            }
        }

        /**
         * The Function is invoked when the window.history changes
         */
        window.onpopstate = () => {
            if (this.noRouterContent()) {
                this.root.style.opacity = '0'
                this.root.style.pointerEvents = 'none'
            }
            else {
                this.root.style.opacity = '1'
                this.root.style.pointerEvents = 'initial'
            }
            this.root.innerHTML = this.routes['/' + window.location.hash];
            this.scripts['/' + window.location.hash]()
        }
    }

    noRouterContent() {
        return window.location.hash === '' || window.location.hash === '#debug'
    }

    onNavClick(pathname) {
        if (pathname === '/' || pathname === '' || pathname === '/#debug') {
            this.root.style.opacity = '0'
            this.root.style.pointerEvents = 'none'
        }
        else {
            this.root.style.opacity = '1'
            this.root.style.pointerEvents = 'initial'
        }
        window.history.pushState({}, pathname, window.location.origin + pathname);
        this.root.innerHTML = this.routes[pathname];
        this.scripts[pathname]()
    }
}

export default new FrontRouter()
