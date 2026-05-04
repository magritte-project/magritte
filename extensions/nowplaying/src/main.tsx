import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

import "./index.css"
import App from "./App.tsx"

// Render the app
const rootElement = document.getElementById("app")
if (rootElement && !rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
        <StrictMode>
            <App />
        </StrictMode>,
    )
}
