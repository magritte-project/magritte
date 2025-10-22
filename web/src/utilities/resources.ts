import type { UserSession } from "@/api/userSession"

export function resolveUrl(
    url: string,
    currentSession: UserSession | null,
): string | undefined {
    if (url.startsWith("magritte://")) {
        if (currentSession === null) {
            return undefined
        }
        return `${url.replace("magritte://", "/api")}?token=${currentSession.accessToken}`
    } else {
        return url
    }
}
