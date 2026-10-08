export function musicVideos<Rest extends any[]>(...rest: Rest) {
    return ["musicVideos", ...rest] as const
}
