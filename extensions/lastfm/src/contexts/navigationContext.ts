import { createContext } from "react"

export type Route =
    | { readonly kind: "home" }
    | { readonly kind: "recent" }
    | { readonly kind: "top" }
    | { readonly kind: "settings" }

export interface Navigation {
    readonly canGoBack: boolean
    push(route: Route): void
    pop(): void
}

export const NavigationContext = createContext<Navigation | undefined>(undefined)
