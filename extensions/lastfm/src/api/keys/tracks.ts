export function recentTracks<Rest extends any[]>(...rest: Rest) {
    return ["recentTracks", ...rest] as const
}

export function topTracks<Rest extends any[]>(...rest: Rest) {
    return ["topTracks", ...rest] as const
}
