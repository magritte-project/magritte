export function recent<Rest extends any[]>(...rest: Rest) {
    return ["recent", ...rest] as const
}
