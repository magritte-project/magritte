export function librarySources<Rest extends any[]>(...rest: Rest) {
    return ["librarySources", ...rest] as const
}
