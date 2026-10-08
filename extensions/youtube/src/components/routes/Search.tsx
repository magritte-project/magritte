import { useQuery } from "@tanstack/react-query"

import { searchVideos } from "@/api/queries/browse"
import ChannelRow from "@/components/ChannelRow"
import SectionState from "@/components/structure/SectionState"
import YouTubeErrorState from "@/components/structure/YouTubeErrorState"
import VideoList from "@/components/VideoList"
import useYouTube from "@/hooks/youtubeHook"

const ORDERS = ["relevance", "views", "newest", "title", "artist"] as const

export interface SearchProps {
    /** What to search for, which is submitted from the toolbar */
    readonly term: string
}

export default function Search({ term }: SearchProps) {
    const { client } = useYouTube()
    const searchQuery = useQuery(searchVideos(client, term))

    if (!term) {
        // Searching as you type would spend a day's quota in a handful of words
        return (
            <p className="px-3 py-2 text-center text-sm text-gray-500">
                Type what you are looking for and press Return.
            </p>
        )
    }
    if (searchQuery.isError) {
        return <YouTubeErrorState error={searchQuery.error} />
    }
    const results = searchQuery.data
    if (results === undefined) {
        return <SectionState status="pending" message="Searching YouTube…" />
    }
    if (results.channels.length + results.videos.length === 0) {
        return (
            <p className="px-3 py-2 text-center text-sm text-gray-500">No results for "{term}"</p>
        )
    }
    return (
        <>
            {results.channels.length > 0 && (
                <section className="flex flex-col">
                    <h2 className="px-3 pt-3 pb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                        Channels
                    </h2>
                    <ol className="flex flex-col">
                        {results.channels.map((channel) => (
                            <ChannelRow key={channel.id} channel={channel} />
                        ))}
                    </ol>
                </section>
            )}
            {results.videos.length > 0 && (
                <VideoList
                    // Keyed so each search starts out ordered by relevance
                    key={term}
                    title="Videos"
                    videos={results.videos}
                    orders={ORDERS}
                />
            )}
        </>
    )
}
