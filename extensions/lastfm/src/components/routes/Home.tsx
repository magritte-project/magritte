import NowPlayingCard from "@/components/NowPlayingCard"
import RecentTracks from "@/components/RecentTracks"
import SignInButton from "@/components/SignInButton"
import TopTracks from "@/components/TopTracks"
import useLastfmAccount from "@/hooks/accountHook"
import useLastfm from "@/hooks/lastfmHook"
import useNavigation from "@/hooks/navigationHook"
import type { TopTracksPeriod } from "@/lastfm/client"

export interface HomeProps {
    readonly period: TopTracksPeriod
    readonly onChangePeriod: (period: TopTracksPeriod) => void
}

export default function Home({ period, onChangePeriod }: HomeProps) {
    const { client } = useLastfm()
    const { session } = useLastfmAccount()
    const navigation = useNavigation()

    if (!client.hasCredentials) {
        return (
            <div className="flex flex-col items-center gap-3 p-6 text-center text-sm text-gray-700">
                <p>
                    This extension needs a Last.fm API key. Add one to its <code>.env</code> file
                    and reload.
                </p>
            </div>
        )
    }

    if (session === null) {
        return (
            <div className="flex flex-col items-center gap-3 p-6 text-center text-sm text-gray-700">
                <p>Sign in to Last.fm to scrobble what you play and see what you listen to.</p>
                <SignInButton />
            </div>
        )
    }

    return (
        <>
            <NowPlayingCard />
            <RecentTracks limit={5} onSeeAll={() => navigation.push({ kind: "recent" })} />
            <TopTracks
                period={period}
                onChangePeriod={onChangePeriod}
                limit={5}
                onSeeAll={() => navigation.push({ kind: "top" })}
            />
        </>
    )
}
