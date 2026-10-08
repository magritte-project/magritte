import MusicVideos from "@/components/MusicVideos"
import SectionState from "@/components/structure/SectionState"
import YouTubeErrorState from "@/components/structure/YouTubeErrorState"
import useNowPlayingLookup from "@/hooks/nowPlayingLookupHook"

/** The music video of whatever the host is playing, following along as it changes */
export default function NowPlaying() {
    const nowPlaying = useNowPlayingLookup()
    switch (nowPlaying.status) {
        case "idle":
            return (
                <div className="px-3 py-8 text-center text-sm text-gray-500">
                    Play something and its music video will show up here.
                </div>
            )
        case "unmatchable":
            return (
                <SectionState
                    status="empty"
                    message="This needs an artist before it can be looked up."
                />
            )
        case "pending":
            return <SectionState status="pending" message="Searching YouTube…" />
        case "error":
            return <YouTubeErrorState error={nowPlaying.error} />
        case "ready":
            return (
                <MusicVideos
                    // Keyed so the video picked from a list does not carry over to the next song
                    key={String(nowPlaying.item.id)}
                    lookup={nowPlaying.lookup}
                    artist={nowPlaying.item.artist_name ?? ""}
                    title={nowPlaying.item.title}
                />
            )
    }
}
