export function resolveResourceUrl(url: string | undefined, token: string): string | undefined {
    if (url !== undefined && url.startsWith("magritte://")) {
        return `${url.replace("magritte://", "/api")}?token=${token}`
    } else {
        return url
    }
}
