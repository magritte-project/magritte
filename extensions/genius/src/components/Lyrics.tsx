import { useSuspenseQuery } from "@tanstack/react-query"

import { readLyrics } from "@/api/queries/lyrics"
import useHostNowPlaying from "@/hooks/hostNowPlayingHook"

import "@/components/Lyrics.css"

export default function Lyrics() {
    const nowPlaying = useHostNowPlaying()
    if (!nowPlaying?.item?.title || !nowPlaying.item.artist_name) {
        return <div>Nothing Playing</div>
    }

    return <SongLyrics artist={nowPlaying.item.artist_name} title={nowPlaying.item.title} />
}

interface SongLyricsProps {
    readonly artist: string
    readonly title: string
}

function SongLyrics({ artist, title }: SongLyricsProps) {
    const { data: lyrics } = useSuspenseQuery(readLyrics(artist, title))
    return <pre className="song-lyrics--text">{lyrics}</pre>
}
