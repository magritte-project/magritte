export function channel<Rest extends any[]>(...rest: Rest) {
    return ["channel", ...rest] as const
}
