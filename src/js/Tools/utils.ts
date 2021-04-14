import { TextureLoader } from "three"

export const textureLoader = new TextureLoader()

export const htmlUtils = {
    scrapeTagText: (html: string, selector: string) => {
        const parser = new DOMParser()
        const markup = parser.parseFromString(html, "text/html")
        return (markup.querySelector(selector) as HTMLElement).innerText
    },
    addToDOM: (string: string) => {
        const parser = new DOMParser()
        const markup = parser.parseFromString(string, "text/html")

        for (const node of Array.from(markup.body.childNodes)) {
          document.body.appendChild(node)
        }
    }
}