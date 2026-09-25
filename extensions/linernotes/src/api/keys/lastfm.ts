export function lastfmArtist<Rest extends any[]>(...rest: Rest) {
    return ["lastfm", "artist", ...rest] as const
}

export function lastfmAlbum<Rest extends any[]>(...rest: Rest) {
    return ["lastfm", "album", ...rest] as const
}

export function lastfmTrack<Rest extends any[]>(...rest: Rest) {
    return ["lastfm", "track", ...rest] as const
}
