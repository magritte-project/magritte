import type { UserSession } from "@magritte/api"

export function resolveUrl(
    url: string | undefined,
    currentSession: UserSession | null,
): string | undefined {
    if (url !== undefined && url.startsWith("magritte://")) {
        if (currentSession === null) {
            return undefined
        }
        return `${url.replace("magritte://", "/api")}?token=${currentSession.accessToken}`
    } else {
        return url
    }
}
