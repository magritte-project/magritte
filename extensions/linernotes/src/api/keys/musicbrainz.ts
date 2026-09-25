export function mbTrackMatch<Rest extends any[]>(...rest: Rest) {
    return ["musicbrainz", "trackMatch", ...rest] as const
}

export function mbArtist<Rest extends any[]>(...rest: Rest) {
    return ["musicbrainz", "artist", ...rest] as const
}

export function mbReleaseGroup<Rest extends any[]>(...rest: Rest) {
    return ["musicbrainz", "releaseGroup", ...rest] as const
}

export function mbRelease<Rest extends any[]>(...rest: Rest) {
    return ["musicbrainz", "release", ...rest] as const
}

export function mbRecording<Rest extends any[]>(...rest: Rest) {
    return ["musicbrainz", "recording", ...rest] as const
}

export function mbDiscography<Rest extends any[]>(...rest: Rest) {
    return ["musicbrainz", "discography", ...rest] as const
}
