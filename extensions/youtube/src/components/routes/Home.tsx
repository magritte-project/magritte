import { useQuery } from "@tanstack/react-query"

import { readTrending } from "@/api/queries/browse"
import NowPlayingBanner from "@/components/NowPlayingBanner"
import SectionState from "@/components/structure/SectionState"
import YouTubeErrorState from "@/components/structure/YouTubeErrorState"
import VideoList from "@/components/VideoList"
import useYouTube from "@/hooks/youtubeHook"

/** The viewer's country, which is what YouTube charts are kept by */
function getRegionCode(): string | undefined {
    try {
        return new Intl.Locale(navigator.language).region
    } catch {
        return undefined
    }
}

export default function Home() {
    const { client } = useYouTube()
    const trendingQuery = useQuery(readTrending(client, getRegionCode()))
    return (
        <>
            <NowPlayingBanner />
            {trendingQuery.isPending && <SectionState status="pending" />}
            {trendingQuery.isError && <YouTubeErrorState error={trendingQuery.error} />}
            {trendingQuery.data && trendingQuery.data.length > 0 && (
                <VideoList title="Trending in music" videos={trendingQuery.data} />
            )}
        </>
    )
}
