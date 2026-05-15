export function extensions() {
    return ["extensions"] as const
}

export function availableExtensions<Rest extends any[]>(...rest: Rest) {
    return [...extensions(), "available", ...rest] as const
}

export function installedExtensions<Rest extends any[]>(...rest: Rest) {
    return [...extensions(), "installed", ...rest] as const
}
