import { createContext } from "react"

import type { YouTubeVideo } from "@/youtube/types"

/** The pages the panel can show. Names are hints so a page can be titled before its data arrives. */
export type Route =
    | { readonly kind: "home" }
    | {
          readonly kind: "search"
          /** What is in the search field */
          readonly query: string
          /** What was last searched for, which only changes when the field is submitted */
          readonly term: string
      }
    | { readonly kind: "nowPlaying" }
    | { readonly kind: "channel"; readonly id: string; readonly name?: string }
    | { readonly kind: "video"; readonly video: YouTubeVideo }

export interface Navigation {
    readonly canGoBack: boolean
    push(route: Route): void
    pop(): void
}

export const NavigationContext = createContext<Navigation | undefined>(undefined)

/** Whether the page a component belongs to is the one on screen, rather than one beneath it */
export const RouteVisibleContext = createContext(true)
