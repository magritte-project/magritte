import { createContext } from "react"

/**
 * The pages the panel can show. Names and titles are hints so a page can be
 * titled before its data arrives.
 */
export type Route =
    | { readonly kind: "nowPlaying" }
    | { readonly kind: "artist"; readonly id: string; readonly name?: string }
    | {
          readonly kind: "album"
          readonly releaseGroupId: string
          readonly releaseId?: string
          readonly title?: string
      }
    | { readonly kind: "recording"; readonly id: string; readonly title?: string }

export interface Navigation {
    readonly canGoBack: boolean
    push(route: Route): void
    pop(): void
    /** Back to what is playing, dropping everything on the way */
    reset(): void
}

export const NavigationContext = createContext<Navigation | undefined>(undefined)
