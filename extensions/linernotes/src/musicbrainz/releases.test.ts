import { describe, expect, it } from "vitest"

import releaseGroupFixture from "@/musicbrainz/fixtures/releaseGroup.json"
import { parseReleaseGroup } from "@/musicbrainz/parse"
import { chooseRepresentativeRelease } from "@/musicbrainz/releases"

const { releases } = parseReleaseGroup(releaseGroupFixture)

describe("chooseRepresentativeRelease", () => {
    it("takes the preferred release when it is there", () => {
        expect(chooseRepresentativeRelease(releases, "rel-nevermind-xw")?.id).toBe(
            "rel-nevermind-xw",
        )
    })

    it("otherwise prefers official, dated releases from well documented markets, earliest first", () => {
        expect(chooseRepresentativeRelease(releases)?.id).toBe("rel-nevermind-us")
        expect(chooseRepresentativeRelease(releases, "unknown")?.id).toBe("rel-nevermind-us")
    })

    it("is undefined without releases", () => {
        expect(chooseRepresentativeRelease([])).toBeUndefined()
    })
})
