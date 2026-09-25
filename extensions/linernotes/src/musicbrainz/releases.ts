import type { ReleaseSummary } from "@/model/types"

/** Worldwide first, then the big English-speaking markets, since those tend to be best documented */
const PREFERRED_COUNTRIES = ["XW", "US", "GB"]

function rank(release: ReleaseSummary): number {
    return (release.status === "Official" ? 2 : 0) + (release.date !== undefined ? 1 : 0)
}

function countryRank(release: ReleaseSummary): number {
    const index = PREFERRED_COUNTRIES.indexOf(release.country ?? "")
    return index === -1 ? PREFERRED_COUNTRIES.length : index
}

/**
 * Pick the release to show for a release group: the one the playing track was
 * matched to when known, otherwise the earliest official, dated one, with a
 * well documented market breaking ties. The original pressing is closer to
 * liner notes than a later remaster.
 */
export function chooseRepresentativeRelease(
    releases: readonly ReleaseSummary[],
    preferredId?: string,
): ReleaseSummary | undefined {
    const preferred = releases.find((release) => release.id === preferredId)
    if (preferred !== undefined) {
        return preferred
    }
    return [...releases].sort(
        (a, b) =>
            rank(b) - rank(a) ||
            (a.date ?? "9999").localeCompare(b.date ?? "9999") ||
            countryRank(a) - countryRank(b),
    )[0]
}
