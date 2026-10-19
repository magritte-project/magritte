import { RPCBroadcaster } from "@magritte/rpc"
import type { NowPlaying, PlayableItem, PlaybackState, PlaybackTime, Player } from "@magritte/sdk"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LastfmAccount } from "@/lastfm/account"
import {
    LastfmClient,
    LastfmError,
    LastfmErrorCode,
    LastfmNetworkError,
    type Scrobble,
} from "@/lastfm/client"
import { Scrobbler } from "@/lastfm/scrobbler"

const POLL_INTERVAL = 5_000

function makeItem(overrides: Partial<PlayableItem> = {}): PlayableItem {
    return {
        id: 1,
        title: "Untitled",
        artist_name: "Someone",
        album_title: "Somewhere",
        start_time: 0,
        end_time: 300,
        ...overrides,
    }
}

/** A player whose position the test moves by hand */
class FakePlayer {
    item: PlayableItem | null = makeItem()
    state: PlaybackState = "playing"
    elapsedTime = 0

    async getNowPlaying(): Promise<NowPlaying> {
        return { state: this.state, item: this.item }
    }

    async getCurrentTime(): Promise<PlaybackTime> {
        return {
            totalTime: this.item ? this.item.end_time - (this.item.start_time ?? 0) : null,
            elapsedTime: this.item ? this.elapsedTime : null,
        }
    }

    /** Play the track for one sampling interval */
    advance(seconds = POLL_INTERVAL / 1000) {
        this.elapsedTime += seconds
    }
}

/** Local storage, without needing a DOM */
class FakeStorage implements Storage {
    private readonly _entries = new Map<string, string>()

    get length() {
        return this._entries.size
    }

    clear() {
        this._entries.clear()
    }

    getItem(key: string) {
        return this._entries.get(key) ?? null
    }

    key(index: number) {
        return Array.from(this._entries.keys())[index] ?? null
    }

    removeItem(key: string) {
        this._entries.delete(key)
    }

    setItem(key: string, value: string) {
        this._entries.set(key, value)
    }
}

interface Harness {
    readonly player: FakePlayer
    readonly account: LastfmAccount
    readonly scrobbler: Scrobbler
    readonly scrobble: ReturnType<typeof vi.fn>
    readonly updateNowPlaying: ReturnType<typeof vi.fn>
    readonly storage: FakeStorage
    /** Sample the player, having played for one interval since the last sample */
    readonly play: (intervals?: number) => Promise<void>
}

function makeHarness(): Harness {
    const player = new FakePlayer()
    const storage = new FakeStorage()
    const account = new LastfmAccount(storage)
    account.signIn({ key: "session-key", name: "listener", subscriber: false })

    const client = new LastfmClient({ apiKey: "key", apiSecret: "secret" })
    const scrobble = vi.fn(async () => [])
    const updateNowPlaying = vi.fn(async () => undefined)
    client.scrobble = scrobble as unknown as LastfmClient["scrobble"]
    client.updateNowPlaying = updateNowPlaying as unknown as LastfmClient["updateNowPlaying"]

    const scrobbler = new Scrobbler({
        account,
        client,
        player: player as unknown as Player,
        broadcaster: new RPCBroadcaster(),
        pollInterval: POLL_INTERVAL,
        storage,
        now: () => 1_700_000_000_000,
    })

    return {
        player,
        account,
        scrobbler,
        scrobble,
        updateNowPlaying,
        storage,
        play: async (intervals = 1) => {
            for (let i = 0; i < intervals; i++) {
                await scrobbler.tick()
                player.advance()
            }
            await scrobbler.tick()
        },
    }
}

/** The scrobbles passed to a `track.scrobble` call */
function submitted(scrobble: ReturnType<typeof vi.fn>, call = 0): readonly Scrobble[] {
    return scrobble.mock.calls[call][0]
}

describe("Scrobbler", () => {
    beforeEach(() => {
        vi.restoreAllMocks()
        vi.spyOn(console, "warn").mockImplementation(() => {})
        vi.spyOn(console, "error").mockImplementation(() => {})
    })

    it("tells Last.fm what is playing as soon as it starts", async () => {
        const { updateNowPlaying, scrobble, play } = makeHarness()
        await play(0)

        expect(updateNowPlaying).toHaveBeenCalledTimes(1)
        expect(updateNowPlaying.mock.calls[0][0]).toMatchObject({
            artist: "Someone",
            track: "Untitled",
            album: "Somewhere",
            duration: 300,
        })
        // A track which just started has not been listened to yet
        expect(scrobble).not.toHaveBeenCalled()
    })

    it("scrobbles once half the track has played", async () => {
        const { scrobble, play } = makeHarness()

        // 300 second track, so the threshold is 150 seconds, or 30 intervals
        await play(29)
        expect(scrobble).not.toHaveBeenCalled()

        await play(1)
        expect(scrobble).toHaveBeenCalledTimes(1)
        expect(submitted(scrobble)).toEqual([
            {
                artist: "Someone",
                track: "Untitled",
                album: "Somewhere",
                trackNumber: undefined,
                duration: 300,
                timestamp: 1_700_000_000,
            },
        ])

        // And not again for the same play
        await play(10)
        expect(scrobble).toHaveBeenCalledTimes(1)
    })

    it("scrobbles long tracks after four minutes rather than half way", async () => {
        const harness = makeHarness()
        harness.player.item = makeItem({ id: 2, end_time: 1200 })

        // 48 intervals is four minutes, well short of the ten minute halfway point
        await harness.play(47)
        expect(harness.scrobble).not.toHaveBeenCalled()

        await harness.play(1)
        expect(harness.scrobble).toHaveBeenCalledTimes(1)
    })

    it("does not count time the track was paused", async () => {
        const harness = makeHarness()

        await harness.play(20)
        harness.player.state = "paused"
        // Time passes, but the position does not move while paused
        for (let i = 0; i < 20; i++) {
            await harness.scrobbler.tick()
        }
        expect(harness.scrobble).not.toHaveBeenCalled()

        harness.player.state = "playing"
        await harness.play(10)
        expect(harness.scrobble).toHaveBeenCalledTimes(1)
    })

    it("does not count time skipped over", async () => {
        const harness = makeHarness()

        await harness.play(5)
        // Seeking most of the way through is not listening to it
        harness.player.elapsedTime = 280
        await harness.play(5)
        expect(harness.scrobble).not.toHaveBeenCalled()
    })

    it("scrobbles a repeated track again", async () => {
        const harness = makeHarness()

        await harness.play(30)
        expect(harness.scrobble).toHaveBeenCalledTimes(1)

        // The same track starts over
        harness.player.elapsedTime = 0
        await harness.play(30)
        expect(harness.scrobble).toHaveBeenCalledTimes(2)
    })

    it("ignores tracks which are too short for Last.fm", async () => {
        const harness = makeHarness()
        harness.player.item = makeItem({ id: 3, end_time: 20 })

        await harness.play(10)
        expect(harness.updateNowPlaying).toHaveBeenCalledTimes(1)
        expect(harness.scrobble).not.toHaveBeenCalled()
    })

    it("ignores tracks with no artist or title", async () => {
        const harness = makeHarness()
        harness.player.item = makeItem({ id: 4, artist_name: null })

        await harness.play(40)
        expect(harness.updateNowPlaying).not.toHaveBeenCalled()
        expect(harness.scrobble).not.toHaveBeenCalled()
    })

    it("submits nothing while scrobbling is switched off", async () => {
        const harness = makeHarness()
        harness.account.setScrobblingEnabled(false)

        await harness.play(40)
        expect(harness.updateNowPlaying).not.toHaveBeenCalled()
        expect(harness.scrobble).not.toHaveBeenCalled()
    })

    it("submits nothing while signed out", async () => {
        const harness = makeHarness()
        harness.account.signOut()

        await harness.play(40)
        expect(harness.scrobble).not.toHaveBeenCalled()
    })

    it("holds on to scrobbles the network lost, and retries them", async () => {
        const harness = makeHarness()
        harness.scrobble.mockRejectedValueOnce(new LastfmNetworkError(new Error("offline")))

        await harness.play(30)
        expect(harness.scrobbler.pendingCount).toBe(1)
        // Held scrobbles survive a reload
        expect(harness.storage.getItem("magritte.lastfm.pending")).toContain("Untitled")

        await harness.scrobbler.tick()
        expect(harness.scrobble).toHaveBeenCalledTimes(2)
        expect(submitted(harness.scrobble, 1)).toHaveLength(1)
        expect(harness.scrobbler.pendingCount).toBe(0)
    })

    it("signs out when Last.fm rejects the session, keeping the play to retry", async () => {
        const harness = makeHarness()
        harness.scrobble.mockRejectedValueOnce(
            new LastfmError(LastfmErrorCode.invalidSessionKey, "Invalid session key"),
        )

        await harness.play(30)
        expect(harness.account.isSignedIn).toBe(false)
        expect(harness.scrobbler.pendingCount).toBe(1)
    })

    it("discards scrobbles Last.fm refuses outright", async () => {
        const harness = makeHarness()
        harness.scrobble.mockRejectedValueOnce(
            new LastfmError(LastfmErrorCode.invalidApiKey, "Invalid API key"),
        )

        await harness.play(30)
        expect(harness.scrobbler.pendingCount).toBe(0)
    })

    it("starts over when the player moves to another track", async () => {
        const harness = makeHarness()

        await harness.play(20)
        harness.player.item = makeItem({ id: 5, title: "Second" })
        harness.player.elapsedTime = 0
        await harness.play(20)

        // Neither track played long enough on its own
        expect(harness.scrobble).not.toHaveBeenCalled()
        expect(harness.updateNowPlaying).toHaveBeenCalledTimes(2)
    })
})
