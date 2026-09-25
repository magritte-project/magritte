import { CaretLeftIcon, HouseIcon } from "@phosphor-icons/react"
import { useCallback, useMemo, useRef, useState } from "react"

import { iconButtonClassName } from "@/components/reusable/buttonStyles"
import Album from "@/components/routes/Album"
import Artist from "@/components/routes/Artist"
import NowPlaying from "@/components/routes/NowPlaying"
import Recording from "@/components/routes/Recording"
import { NavigationContext, type Navigation, type Route } from "@/contexts/navigationContext"

interface StackEntry {
    readonly key: number
    readonly route: Route
}

/** Artists and albums link to each other, so a long browse should not pile up forever */
const MAX_DEPTH = 20

const ROOT: StackEntry = { key: 0, route: { kind: "nowPlaying" } }

function getRouteTitle(route: Route): string {
    switch (route.kind) {
        case "nowPlaying":
            return "Liner Notes"
        case "artist":
            return route.name ?? "Artist"
        case "album":
            return route.title ?? "Album"
        case "recording":
            return route.title ?? "Song"
    }
}

function isSameRoute(a: Route, b: Route): boolean {
    switch (a.kind) {
        case "nowPlaying":
            return b.kind === "nowPlaying"
        case "artist":
            return b.kind === "artist" && a.id === b.id
        case "album":
            return b.kind === "album" && a.releaseGroupId === b.releaseGroupId
        case "recording":
            return b.kind === "recording" && a.id === b.id
    }
}

function RouteView({ route }: { readonly route: Route }) {
    switch (route.kind) {
        case "nowPlaying":
            return <NowPlaying />
        case "artist":
            return <Artist id={route.id} name={route.name} />
        case "album":
            return (
                <Album
                    releaseGroupId={route.releaseGroupId}
                    releaseId={route.releaseId}
                    title={route.title}
                />
            )
        case "recording":
            return <Recording id={route.id} title={route.title} />
    }
}

export default function Extension() {
    const nextKey = useRef(1)
    const [stack, setStack] = useState<readonly StackEntry[]>([ROOT])
    const top = stack[stack.length - 1]

    const push = useCallback((route: Route) => {
        setStack((stack) => {
            // Opening the page already on top, e.g. a double click, is a no-op
            if (isSameRoute(stack[stack.length - 1].route, route)) {
                return stack
            }
            const key = nextKey.current++
            const next = [...stack, { key, route }]
            return next.length > MAX_DEPTH ? [next[0], ...next.slice(2)] : next
        })
    }, [])
    const pop = useCallback(() => {
        setStack((stack) => (stack.length > 1 ? stack.slice(0, -1) : stack))
    }, [])
    const reset = useCallback(() => {
        setStack((stack) => (stack.length > 1 ? [stack[0]] : stack))
    }, [])
    const navigation = useMemo(
        (): Navigation => ({ canGoBack: stack.length > 1, push, pop, reset }),
        [stack.length, push, pop, reset],
    )

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
                {stack.length > 1 && (
                    <button
                        type="button"
                        className={iconButtonClassName}
                        title="Back to what's playing"
                        onClick={reset}
                    >
                        <HouseIcon size="1.25em" />
                    </button>
                )}
            </header>
            {/* Entries stay mounted so their state survives going back, only one is visible */}
            {stack.map((entry) => (
                <div key={entry.key} hidden={entry !== top}>
                    <RouteView route={entry.route} />
                </div>
            ))}
        </NavigationContext.Provider>
    )
}
