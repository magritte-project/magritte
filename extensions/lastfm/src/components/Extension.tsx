import { CaretLeftIcon, GearSixIcon } from "@phosphor-icons/react"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { recentTracks, topTracks } from "@/api/keys/tracks"
import RecentTracks, { RECENT_TRACKS_TITLE } from "@/components/RecentTracks"
import { iconButtonClassName } from "@/components/reusable/buttonStyles"
import Home from "@/components/routes/Home"
import Settings from "@/components/routes/Settings"
import TopTracks, { TOP_TRACKS_TITLE } from "@/components/TopTracks"
import { NavigationContext, type Navigation, type Route } from "@/contexts/navigationContext"
import useLastfm from "@/hooks/lastfmHook"
import type { TopTracksPeriod } from "@/lastfm/client"

interface StackEntry {
    readonly key: number
    readonly route: Route
}

function getRouteTitle(route: Route): string {
    switch (route.kind) {
        case "home":
            return "Last.fm"
        case "recent":
            return RECENT_TRACKS_TITLE
        case "top":
            return TOP_TRACKS_TITLE
        case "settings":
            return "Settings"
    }
}

export default function Extension() {
    const nextKey = useRef(1)
    const [stack, setStack] = useState<readonly StackEntry[]>([{ key: 0, route: { kind: "home" } }])
    // Shared by the preview on the home view and the full list, so switching
    // periods in one place does not leave the other showing something else
    const [period, setPeriod] = useState<TopTracksPeriod>("7day")
    const top = stack[stack.length - 1]

    const push = useCallback((route: Route) => {
        const key = nextKey.current++
        setStack((stack) => [...stack, { key, route }])
    }, [])
    const pop = useCallback(() => {
        setStack((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack))
    }, [])
    // Settings jumps back to its existing entry rather than stacking duplicates
    const revealSettings = useCallback(() => {
        const key = nextKey.current++
        setStack((stack) => {
            const index = stack.findIndex((entry) => entry.route.kind === "settings")
            return index !== -1
                ? stack.slice(0, index + 1)
                : [...stack, { key, route: { kind: "settings" } }]
        })
    }, [])
    const navigation = useMemo(
        (): Navigation => ({ canGoBack: stack.length > 1, push, pop }),
        [stack.length, push, pop],
    )

    // Scrobbles this extension submits are the main reason the lists change
    const { scrobbler } = useLastfm()
    const queryClient = useQueryClient()
    useEffect(() => {
        return scrobbler.subscribe((event) => {
            if (event.type === "scrobbled") {
                queryClient.invalidateQueries({ queryKey: recentTracks() })
                queryClient.invalidateQueries({ queryKey: topTracks() })
            }
        })
    }, [scrobbler, queryClient])

    return (
        <NavigationContext.Provider value={navigation}>
            <header className="sticky top-0 z-40 flex shrink-0 items-center gap-2 p-2 text-sm font-semibold backdrop-blur-[20px]">
                {stack.length > 1 && (
                    <button
                        type="button"
                        className={iconButtonClassName}
                        title="Back"
                        onClick={pop}
                    >
                        <CaretLeftIcon size="1.25em" />
                    </button>
                )}
                <div className="min-w-0 flex-1 truncate">{getRouteTitle(top.route)}</div>
                {top.route.kind !== "settings" && (
                    <button
                        type="button"
                        className={iconButtonClassName}
                        title="Settings"
                        onClick={revealSettings}
                    >
                        <GearSixIcon size="1.25em" />
                    </button>
                )}
            </header>
            {/* Entries stay mounted so their state survives going back, only one is visible */}
            {stack.map((entry) => (
                <div key={entry.key} hidden={entry !== top}>
                    {entry.route.kind === "home" && (
                        <Home period={period} onChangePeriod={setPeriod} />
                    )}
                    {entry.route.kind === "recent" && <RecentTracks />}
                    {entry.route.kind === "top" && (
                        <TopTracks period={period} onChangePeriod={setPeriod} />
                    )}
                    {entry.route.kind === "settings" && <Settings />}
                </div>
            ))}
        </NavigationContext.Provider>
    )
}
