import { TextureLoader } from "three"

export const textureLoader = new TextureLoader()

export const htmlUtils = {
    addToDOM: (string) => {
        const parser = new DOMParser();
        const markup = parser.parseFromString(string, "text/html");

        for (const node of Array.from(markup.body.childNodes)) {
          document.body.appendChild(node);
        }
    }
}