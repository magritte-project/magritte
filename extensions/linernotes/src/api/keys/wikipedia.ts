export function wikipediaTitle<Rest extends any[]>(...rest: Rest) {
    return ["wikipedia", "title", ...rest] as const
}

export function wikipediaArticle<Rest extends any[]>(...rest: Rest) {
    return ["wikipedia", "article", ...rest] as const
}
