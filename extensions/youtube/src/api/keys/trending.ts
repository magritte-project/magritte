export function trending<Rest extends any[]>(...rest: Rest) {
    return ["trending", ...rest] as const
}
