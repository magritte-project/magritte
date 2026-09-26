export function lyrics<Rest extends any[]>(...rest: Rest) {
    return ["lyrics", ...rest] as const
}
