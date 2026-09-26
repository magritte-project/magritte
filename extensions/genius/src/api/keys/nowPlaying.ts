export function nowPlaying<Rest extends any[]>(...rest: Rest) {
    return ["nowPlaying", ...rest] as const
}
