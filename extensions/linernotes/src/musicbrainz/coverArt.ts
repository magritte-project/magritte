export type CoverArtSize = 250 | 500 | 1200

/**
 * The front cover of a release or release group from the Cover Art Archive.
 *
 * The archive answers with a redirect, and a 404 when there is no art, so this
 * is only ever used as an image source with a fallback, never fetched.
 */
export function coverArtUrl(
    entity: { readonly kind: "release" | "release-group"; readonly id: string },
    size: CoverArtSize = 250,
): string {
    return `https://coverartarchive.org/${entity.kind}/${entity.id}/front-${size}`
}
