export interface Version {
    readonly major: number
    readonly minor: number
    readonly patch: number
}

export function compare(a: Version, b: Version): number {
    if (a.major !== b.major) return a.major - b.major
    if (a.minor !== b.minor) return a.minor - b.minor
    return a.patch - b.patch
}
