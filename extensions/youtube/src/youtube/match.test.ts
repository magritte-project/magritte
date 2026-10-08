import { describe, expect, it } from "vitest"

import {
    fold,
    isOfficialChannel,
    isTopicChannel,
    pickArtistVideos,
    pickSongVideos,
} from "@/youtube/match"
import type { YouTubeChannel, YouTubeVideo } from "@/youtube/types"

let nextId = 0

function video(title: string, channelTitle: string, viewCount = 0): YouTubeVideo {
    const id = `video-${nextId++}`
    return {
        id,
        title,
        channelId: `channel:${channelTitle}`,
        channelTitle,
        viewCount,
        embeddable: true,
    }
}

function channel(title: string, subscriberCount?: number): YouTubeChannel {
    return { id: `channel:${title}`, title, subscriberCount }
}

describe("fold", () => {
    it("drops case, accents and punctuation", () => {
        expect(fold("Beyoncé – Déjà Vu!")).toBe("beyonce deja vu")
        expect(fold("Don’t Stop (Me) Now")).toBe("dont stop me now")
        expect(fold("Simon & Garfunkel")).toBe("simon and garfunkel")
        expect(fold(null)).toBe("")
    })
})

describe("isTopicChannel", () => {
    it("recognizes generated channels", () => {
        expect(isTopicChannel("Nirvana - Topic")).toBe(true)
        expect(isTopicChannel("Nirvana")).toBe(false)
    })
})

describe("isOfficialChannel", () => {
    it.each([
        ["Nirvana", "Nirvana"],
        ["NirvanaVEVO", "Nirvana"],
        ["Nirvana Official", "Nirvana"],
        ["Official Nirvana", "Nirvana"],
        ["TheBeatlesVEVO", "The Beatles"],
        ["The Beatles", "Beatles"],
        ["beyonceVEVO", "Beyoncé"],
        ["Daft Punk Music TV", "Daft Punk"],
        ["Television", "Television"],
        ["QueenVEVO", "Queen feat. David Bowie"],
        ["Simon & Garfunkel", "Simon and Garfunkel"],
    ])("accepts %s for %s", (channelTitle, artist) => {
        expect(isOfficialChannel(channelTitle, artist)).toBe(true)
    })

    it.each([
        ["Nirvana - Topic", "Nirvana"],
        ["Nirvana Fan Archive", "Nirvana"],
        ["Lyrics World", "Nirvana"],
        ["VEVO", ""],
    ])("rejects %s for %s", (channelTitle, artist) => {
        expect(isOfficialChannel(channelTitle, artist)).toBe(false)
    })
})

describe("pickSongVideos", () => {
    it("prefers the official video over more viewed uploads", () => {
        const official = video("Nirvana - Lithium (Official Music Video)", "NirvanaVEVO", 500)
        const fan = video("Nirvana - Lithium", "Some Fan", 9000)
        const picked = pickSongVideos([fan, official], "Nirvana", "Lithium")

        expect(picked?.kind).toBe("official")
        expect(picked?.video).toBe(official)
        expect(picked?.alternates).toEqual([fan])
    })

    it("prefers a video labelled official among an official channel's uploads", () => {
        const labelled = video("Adele - Hello (Official Music Video)", "AdeleVEVO", 10)
        const plain = video("Adele - Hello", "Adele", 9000)
        expect(pickSongVideos([plain, labelled], "Adele", "Hello")?.video).toBe(labelled)
    })

    it("does not take lyric videos, audio or live recordings as the official video", () => {
        const fan = video("Nirvana - Lithium music video", "Some Fan", 9000)
        const picked = pickSongVideos(
            [
                video("Nirvana - Lithium (Official Audio)", "NirvanaVEVO", 100),
                video("Nirvana - Lithium (Lyric Video)", "Nirvana", 200),
                video("Nirvana - Lithium (Live at Reading 1992)", "Nirvana", 300),
                fan,
            ],
            "Nirvana",
            "Lithium",
        )
        expect(picked?.kind).toBe("popular")
        expect(picked?.video).toBe(fan)
        expect(picked?.alternates.map((video) => video.viewCount)).toEqual([300, 200, 100])
    })

    it("allows words the song's own title contains", () => {
        const official = video("Oasis - Live Forever (Official Video)", "Oasis", 10)
        expect(pickSongVideos([official], "Oasis", "Live Forever")?.kind).toBe("official")
    })

    it("falls back to the most viewed video of the song", () => {
        const most = video("Obscure Band - Deep Cut (fan video)", "Uploader B", 700)
        const picked = pickSongVideos(
            [video("Obscure Band - Deep Cut", "Uploader A", 50), most],
            "Obscure Band",
            "Deep Cut",
        )
        expect(picked?.kind).toBe("popular")
        expect(picked?.video).toBe(most)
    })

    it("ignores edition suffixes on the playing song", () => {
        const official = video("The Beatles - Come Together", "The Beatles", 10)
        expect(
            pickSongVideos([official], "The Beatles", "Come Together - Remastered 2009")?.video,
        ).toBe(official)
        expect(pickSongVideos([official], "The Beatles", "Come Together (2019 Mix)")?.video).toBe(
            official,
        )
    })

    it("finds nothing among other songs, other artists and topic channels", () => {
        expect(
            pickSongVideos(
                [
                    video("Nirvana - Come As You Are (Official Music Video)", "NirvanaVEVO", 900),
                    video("Lithium", "Evanescence", 900),
                    video("Lithium", "Nirvana - Topic", 900),
                    video("Lithiumate your phone battery", "Tech Tips", 900),
                ],
                "Nirvana",
                "Lithium",
            ),
        ).toBeNull()
    })
})

describe("pickArtistVideos", () => {
    it("picks the most subscribed channel carrying the artist's name", () => {
        const real = channel("Nirvana", 5_000_000)
        const picked = pickArtistVideos(
            [],
            [channel("Nirvana", 12), real, channel("Nirvana Covers", 90_000_000)],
            "Nirvana",
        )
        expect(picked.channel).toBe(real)
        expect(picked.videos).toEqual([])
    })

    it("has no channel when none carry the artist's name", () => {
        expect(pickArtistVideos([], [channel("Grunge Daily", 100)], "Nirvana").channel).toBeNull()
    })

    it("lists official uploads first and drops what is not the artist's", () => {
        const official = video("Come As You Are", "NirvanaVEVO", 10)
        const fan = video("Nirvana - Rare Footage", "Some Fan", 9000)
        const picked = pickArtistVideos(
            [
                fan,
                video("Smells Like Teen Spirit", "Nirvana - Topic", 9999),
                video("Top 10 Grunge Bands", "Music Lists", 9999),
                official,
            ],
            [],
            "Nirvana",
        )
        expect(picked.kind).toBe("artist")
        expect(picked.videos).toEqual([official, fan])
    })
})
