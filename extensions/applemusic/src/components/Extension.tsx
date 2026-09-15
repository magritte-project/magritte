import { CaretLeftIcon, GearSixIcon, MagnifyingGlassIcon } from "@phosphor-icons/react"
import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

import { recent } from "@/api/keys/recent"
import { getRecentTitle } from "@/api/queries/recent"
import RecentItems from "@/components/RecentItems"
import { iconButtonClassName } from "@/components/reusable/buttonStyles"
import Artist from "@/components/routes/Artist"
import Collection from "@/components/routes/Collection"
import Home from "@/components/routes/Home"
import Search from "@/components/routes/Search"
import Settings from "@/components/routes/Settings"
import DRMBanner from "@/components/structure/DRMBanner"
import { NavigationContext, type Navigation, type Route } from "@/contexts/navigationContext"
import useMusicKit from "@/hooks/musicKitHook"
import { getCollectionKindLabel } from "@/musickit/models/collection"

interface StackEntry {
    readonly key: number
    readonly route: Route
}

function getRouteTitle(route: Route): string {
    switch (route.kind) {
        case "home":
            return "Apple Music"
        case "search":
            return "Search"
        case "settings":
            return "Settings"
        case "recent":
            return getRecentTitle(route.recent)
        case "artist":
            return route.name ?? "Artist"
        case "collection":
            return route.name ?? getCollectionKindLabel(route.collectionKind)
    }
}

function RouteContent({ route }: { readonly route: Route }) {
    switch (route.kind) {
        case "home":
            return <Home />
        case "search":
            return <Search query={route.query} />
        case "settings":
            return <Settings />
        case "recent":
            return <RecentItems kind={route.recent} />
        case "artist":
            return <Artist id={route.id} />
        case "collection":
            return <Collection kind={route.collectionKind} id={route.id} />
    }
}

export default function Extension() {
    const nextKey = useRef(1)
    const [stack, setStack] = useState<readonly StackEntry[]>([{ key: 0, route: { kind: "home" } }])
    const top = stack[stack.length - 1]
    // Until something is typed, search shows the view it was opened from beneath the field
    const visibleEntry =
        top.route.kind === "search" && !top.route.query && stack.length > 1
            ? stack[stack.length - 2]
            : top

    const push = useCallback((route: Route) => {
        const key = nextKey.current++
        setStack((stack) => [...stack, { key, route }])
    }, [])
    const pop = useCallback(() => {
        setStack((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack))
    }, [])
    // Search and settings jump back to their existing entry rather than stacking duplicates
    const reveal = useCallback((route: Route & { kind: "search" | "settings" }) => {
        const key = nextKey.current++
        setStack((stack) => {
            const index = stack.findIndex((entry) => entry.route.kind === route.kind)
            return index !== -1 ? stack.slice(0, index + 1) : [...stack, { key, route }]
        })
    }, [])
    const setSearchQuery = useCallback((key: number, query: string) => {
        setStack((stack) =>
            stack.map((entry) =>
                entry.key === key && entry.route.kind === "search"
                    ? { ...entry, route: { ...entry.route, query } }
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
    const visibleKey = useRef(visibleEntry.key)
    useEffect(() => {
        const handleScroll = () => scrollPositions.current.set(visibleKey.current, window.scrollY)
        window.addEventListener("scroll", handleScroll, { passive: true })
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])
    useLayoutEffect(() => {
        visibleKey.current = visibleEntry.key
        window.scrollTo(0, scrollPositions.current.get(visibleEntry.key) ?? 0)
    }, [visibleEntry.key])

    // Recents belong to the authorized account, so refetch them when it changes
    const musicKit = useMusicKit()
    const queryClient = useQueryClient()
    useEffect(() => {
        const handleAuthorizationStatusDidChange = () => {
            queryClient.resetQueries({ queryKey: recent() })
        }
        musicKit.addEventListener(
            "authorizationStatusDidChange",
            handleAuthorizationStatusDidChange,
        )
        return () => {
            musicKit.removeEventListener(
                "authorizationStatusDidChange",
                handleAuthorizationStatusDidChange,
            )
        }
    }, [musicKit, queryClient])

    return (
        <NavigationContext.Provider value={navigation}>
            <header className="shrink-0 sticky top-0 backdrop-blur-[20px] text-sm font-semibold flex items-center gap-2 p-2 z-40">
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
                    <label className="flex-1 min-w-0 flex items-center gap-1.5 rounded-lg bg-black/5 px-2 py-1 font-normal text-gray-950 focus-within:ring-2 focus-within:ring-blue-500">
                        <MagnifyingGlassIcon className="shrink-0 text-black/40" aria-hidden />
                        <input
                            // Remount per search entry, so returning to one focuses it again
                            key={top.key}
                            type="search"
                            aria-label="Search Apple Music"
                            className="flex-1 min-w-0 bg-transparent outline-0 placeholder:text-black/40"
                            placeholder="Artists, albums, and songs"
                            autoFocus
                            value={top.route.query}
                            onChange={(e) => setSearchQuery(top.key, e.currentTarget.value)}
                            onKeyDown={(e) => {
                                // Escape clears the field first, then leaves search
                                if (e.key === "Escape" && !e.currentTarget.value) {
                                    pop()
                                }
                            }}
                        />
                    </label>
                ) : (
                    <>
                        <div className="flex-1 min-w-0 truncate">{getRouteTitle(top.route)}</div>
                        <button
                            type="button"
                            className={iconButtonClassName}
                            title="Search"
                            onClick={() => reveal({ kind: "search", query: "" })}
                        >
                            <MagnifyingGlassIcon size="1.25em" />
                        </button>
                        {top.route.kind !== "settings" && (
                            <button
                                type="button"
                                className={iconButtonClassName}
                                title="Settings"
                                onClick={() => reveal({ kind: "settings" })}
                            >
                                <GearSixIcon size="1.25em" />
                            </button>
                        )}
                    </>
                )}
            </header>
            <DRMBanner />
            {/* Entries stay mounted so their state survives going back, only one is visible */}
            {stack.map((entry) => (
                <div key={entry.key} hidden={entry !== visibleEntry}>
                    <RouteContent route={entry.route} />
                </div>
            ))}
        </NavigationContext.Provider>
    )
}
