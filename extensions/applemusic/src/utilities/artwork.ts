import type { MusicArtwork } from "@/musickit/models/base"

/** Fill in the size placeholders of an artwork URL, never exceeding the artwork's maximum size */
export function formatArtworkUrl(artwork: MusicArtwork, maxSize: number): string {
    // Library artwork does not always report its dimensions
    const width = artwork.width ? Math.min(maxSize, artwork.width) : maxSize
    const height = artwork.height ? Math.min(maxSize, artwork.height) : maxSize
    return artwork.url.replace("{w}", String(width)).replace("{h}", String(height))
}
