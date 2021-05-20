import { TextureLoader } from "three"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export const textureLoader = new TextureLoader()
export const modelLoader = new GLTFLoader()

export const htmlUtils = {
    scrapeTagText: (html: string, selector: string) => {
        const parser = new DOMParser()
        const markup = parser.parseFromString(html, "text/html")
        return (markup.querySelector(selector) as HTMLElement).innerText
    },
    addToDOM: (string: string, variables: any) => {
        let html = string
        Object.keys(variables).forEach(variable => {
            html = html.replace(new RegExp(`\{\{${variable}\}\}`, 'i'), variables[variable])
        })

        const parser = new DOMParser()
        const markup = parser.parseFromString(html, "text/html")

        for (const node of Array.from(markup.body.childNodes)) {
          document.body.appendChild(node)
        }
    },
    renderToDOM: (element: HTMLElement, string: string, variables: any) => {
        let html = string
        Object.keys(variables).forEach(variable => {
            html = html.replace(new RegExp(`\{\{${variable}\}\}`, 'i'), variables[variable])
        })

        const parser = new DOMParser()
        const markup = parser.parseFromString(html, "text/html")

        element.innerHTML = ''
        for (const node of Array.from(markup.body.childNodes)) {
          element.appendChild(node)
        }
    }
}