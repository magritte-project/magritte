export type QueueItemKind = "song"

export interface QueueItemID {
    readonly kind: QueueItemKind
    readonly identity: number
}

export interface QueueItemArtwork {
    readonly source: string
}

export interface QueueItem {
    readonly id: QueueItemID
    readonly startTime: number
    readonly endTime: number
    readonly sourceURL: string
    readonly artwork: QueueItemArtwork
    readonly title: string | null
    readonly artist: string | null
    readonly albumTitle: string | null
    readonly albumArtist: string | null
    readonly composer: string | null
    readonly genre: string | null
    readonly isCompilation: boolean | null
    readonly releaseDate: string | null
    readonly trackNumber: number | null
    readonly trackTotal: number | null
    readonly discNumber: number | null
    readonly discTotal: number | null
    readonly lyrics: string | null
    readonly bpm: number | null
}
