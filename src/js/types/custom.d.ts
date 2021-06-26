import App from "../App";

declare global {
    interface Window { 
        App: App
    }
}