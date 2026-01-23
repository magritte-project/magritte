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

/** Creates a version */
export function version(major: number, minor: number = 0, patch: number = 0): Version {
    return { major, minor, patch }
}
