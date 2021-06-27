import { TextureLoader } from "three"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

export const textureLoader = new TextureLoader()
export const modelLoader = new GLTFLoader()

export const htmlUtils = {
    // get text from html tag
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
            html = html.replace(new RegExp(`\{\{${variable}\}\}`, 'gi'), variables[variable])
        })

        const parser = new DOMParser()
        const markup = parser.parseFromString(html, "text/html")

        element.innerHTML = ''
        for (const node of Array.from(markup.body.childNodes)) {
          element.appendChild(node)
        }
    },
    createHTMLFromTemplate: (string: string, variables: any) => {
        let html = string
        Object.keys(variables).forEach(variable => {
            html = html.replace(new RegExp(`\{\{${variable}\}\}`, 'gi'), variables[variable])
        })

        return html
    },
    insertHTMLInTemplate: (template: string, html: string, name: string) => {
        return template.replace(new RegExp(`\{\{${name}\}\}`, 'gi'), html)
    },
}

export const colorUtils = {
    mixColors:(color1: number, color2: number, percentage: number) => {
        const color1number = 1 - percentage * 10
        const color2number = percentage * 10
    
        const sum = color1number*color1 + color2number*color2
        return sum
    }
}