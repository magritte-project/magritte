export function loadScript(src: string) {
    return new Promise<HTMLScriptElement>((resolve, reject) => {
        const script = document.createElement("script")
        script.src = src
        script.onload = () => resolve(script)
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
        document.body.appendChild(script)
    })
}
