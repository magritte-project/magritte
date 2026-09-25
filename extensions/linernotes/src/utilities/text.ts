/**
 * Suffixes that distinguish editions of the same song or album, which the
 * playing item may carry but MusicBrainz titles usually do not.
 */
const EDITION_SUFFIXES =
    /\s*[([][^)\]]*\b(remaster(?:ed)?|deluxe|expanded|anniversary|edition|explicit|bonus|mono|stereo|version|mix|edit|live|demo|feat\.?|featuring)\b[^)\]]*[)\]]\s*$/i

const DASHED_EDITION_SUFFIXES =
    /\s+[-–—]\s+(?:\d{4}\s+)?(?:remaster(?:ed)?|deluxe|expanded|anniversary|explicit|mono|stereo|live|demo|single|radio|album)\b.*$/i

/** Lowercase without accents, the form the suffix patterns are written for */
function fold(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
}

function stripEditionSuffixes(folded: string): string {
    let stripped = folded
    // Strip repeatedly, a title can carry more than one suffix
    for (;;) {
        const next = stripped.replace(EDITION_SUFFIXES, "").replace(DASHED_EDITION_SUFFIXES, "")
        if (next === stripped || next.trim().length === 0) {
            return stripped
        }
        stripped = next
    }
}

/**
 * A title without its edition suffixes, for searching: MusicBrainz titles the
 * song `Come Together` and the album `Abbey Road`, whatever the tags say.
 */
export function stripEditionSuffixesForSearch(value: string): string {
    const stripped = stripEditionSuffixes(value).trim()
    return stripped.length > 0 ? stripped : value.trim()
}

/** Whether a title names an edition, e.g. `Nevermind (Deluxe Edition)` */
export function hasEditionSuffix(value: string | null | undefined): boolean {
    if (!value) {
        return false
    }
    const folded = fold(value)
    return stripEditionSuffixes(folded) !== folded
}

/**
 * Reduce a title or name to a form that survives the differences between
 * sources: case, accents, punctuation, `&` versus `and`, and edition suffixes
 * like `(2011 Remaster)`.
 */
export function normalizeForMatch(value: string | null | undefined): string {
    if (!value) {
        return ""
    }
    return stripEditionSuffixes(fold(value))
        .replace(/&/g, " and ")
        .replace(/[’'`"“”]/g, "")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim()
        .replace(/\s+/g, " ")
}

/** How closely two titles agree, after normalization */
export function compareTitles(
    a: string | null | undefined,
    b: string | null | undefined,
): 0 | 1 | 2 {
    const left = normalizeForMatch(a)
    const right = normalizeForMatch(b)
    if (left.length === 0 || right.length === 0) {
        return 0
    }
    if (left === right) {
        return 2
    }
    return left.includes(right) || right.includes(left) ? 1 : 0
}
