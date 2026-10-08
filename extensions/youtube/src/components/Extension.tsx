import { CaretLeftIcon, MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

import NowWatching from "@/components/NowWatching"
import { iconButtonClassName } from "@/components/reusable/buttonStyles"
import Channel from "@/components/routes/Channel"
import Home from "@/components/routes/Home"
import NowPlaying from "@/components/routes/NowPlaying"
import Search from "@/components/routes/Search"
import SectionState from "@/components/structure/SectionState"
import {
    NavigationContext,
    RouteVisibleContext,
    type Navigation,
    type Route,
} from "@/contexts/navigationContext"
import useYouTube from "@/hooks/youtubeHook"

interface StackEntry {
    readonly key: number
    readonly route: Route
}

function getRouteTitle(route: Route): string {
    switch (route.kind) {
        case "home":
            return "YouTube"
        case "search":
            return "Search"
        case "nowPlaying":
            return "Now Playing"
        case "channel":
            return route.name ?? "Channel"
        case "video":
            return route.video.title
    }
}

function RouteContent({ route }: { readonly route: Route }) {
    switch (route.kind) {
        case "home":
            return <Home />
        case "search":
            return <Search term={route.term} />
        case "nowPlaying":
            return <NowPlaying />
        case "channel":
            return <Channel id={route.id} />
        case "video":
            return <NowWatching video={route.video} />
    }
}

export default function Extension() {
    const { client } = useYouTube()
    const nextKey = useRef(1)
    const [stack, setStack] = useState<readonly StackEntry[]>([{ key: 0, route: { kind: "home" } }])
    const top = stack[stack.length - 1]

    const push = useCallback((route: Route) => {
        const key = nextKey.current++
        setStack((stack) => [...stack, { key, route }])
    }, [])
    const pop = useCallback(() => {
        setStack((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack))
    }, [])
    // Search jumps back to its existing entry rather than stacking duplicates
    const revealSearch = useCallback(() => {
        const key = nextKey.current++
        setStack((stack) => {
            const index = stack.findIndex((entry) => entry.route.kind === "search")
            return index !== -1
                ? stack.slice(0, index + 1)
                : [...stack, { key, route: { kind: "search", query: "", term: "" } }]
        })
    }, [])
    const updateSearch = useCallback((key: number, changes: { query?: string; term?: string }) => {
        setStack((stack) =>
            stack.map((entry) =>
                entry.key === key && entry.route.kind === "search"
                    ? { ...entry, route: { ...entry.route, ...changes } }
                    : entry,
            ),
        )
    }, [])
    const navigation = useMemo(
        (): Navigation => ({ canGoBack: stack.length > 1, push, pop }),
        [stack.length, push, pop],
    )

    // Every entry shares the window's scroll position, so remember it per entry
    const scrollPositions = useRef(new Map<number, number>())
    const visibleKey = useRef(top.key)
    useEffect(() => {
        const handleScroll = () => scrollPositions.current.set(visibleKey.current, window.scrollY)
        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])
    useLayoutEffect(() => {
        visibleKey.current = top.key
        window.scrollTo(0, scrollPositions.current.get(top.key) ?? 0)
    }, [top.key])

    if (!client.hasCredentials) {
        return (
            <SectionState
                status="empty"
                message="This extension needs a YouTube API key. Set VITE_YOUTUBE_API_KEY in its .env file."
            />
        )
    }
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
                {top.route.kind === "search" ? (
                    <form
                        className="min-w-0 flex-1"
                        role="search"
                        onSubmit={(event) => {
                            event.preventDefault()
                            if (top.route.kind === "search") {
                                updateSearch(top.key, { term: top.route.query.trim() })
                            }
                        }}
                    >
                        <label className="flex items-center gap-1.5 rounded-lg bg-black/5 px-2 py-1 font-normal text-gray-950 focus-within:ring-2 focus-within:ring-blue-500">
                            <MagnifyingGlassIcon className="shrink-0 text-black/40" aria-hidden />
                            <input
                                // Remount per search entry, so returning to one focuses it again
                                key={top.key}
                                type="search"
                                aria-label="Search YouTube"
                                className="min-w-0 flex-1 bg-transparent outline-0 placeholder:text-black/40"
                                placeholder="Videos and channels"
                                autoFocus
                                value={top.route.query}
                                onChange={(event) =>
                                    updateSearch(top.key, { query: event.currentTarget.value })
                                }
                                onKeyDown={(event) => {
                                    // Escape clears the field first, then leaves search
                                    if (event.key === "Escape" && !event.currentTarget.value) {
                                        pop()
                                    }
                                }}
                            />
                        </label>
                    </form>
                ) : (
                    <>
                        <div className="min-w-0 flex-1 truncate">{getRouteTitle(top.route)}</div>
                        <button
                            type="button"
                            className={iconButtonClassName}
                            title="Search"
                            onClick={revealSearch}
                        >
                            <MagnifyingGlassIcon size="1.25em" />
                        </button>
                    </>
                )}
            </header>
            {/* Entries stay mounted so their state survives going back, only one is visible */}
            {stack.map((entry) => (
                <div key={entry.key} hidden={entry !== top}>
                    <RouteVisibleContext.Provider value={entry === top}>
                        <RouteContent route={entry.route} />
                    </RouteVisibleContext.Provider>
                </div>
            ))}
        </NavigationContext.Provider>
    )
}
