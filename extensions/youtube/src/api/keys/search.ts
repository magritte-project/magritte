export function search<Rest extends any[]>(...rest: Rest) {
    return ["search", ...rest] as const
}
