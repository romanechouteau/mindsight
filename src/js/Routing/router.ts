//Declare the variables for home, about & contact html pages
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
        }

        window.onload = () => {
            console.log(window.location);
            
            if (window.location.hash !== '') {
                this.onNavClick('/' + window.location.hash)
            }
        }

        /**
         * The Function is invoked when the window.history changes
         */
        window.onpopstate = () => {
            if (window.location.hash === '') {
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

    onNavClick(pathname) {
        if (pathname === '/' || pathname === '') {
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
