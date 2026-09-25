export function commandInputs<Rest extends any[]>(...rest: Rest) {
    return ["commandInputs", ...rest] as const
}
