import type { PlayableItem, PlaybackTime } from "@magritte/sdk"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type {
    PlaybackEngine,
    PlaybackEngineEnqueueOptions,
    PlaybackEngineEvent,
} from "@/playback/engine"
import type PlaybackEngineRegistry from "@/playback/engineRegistry"
import type { PlaybackEngineRegistryEvent } from "@/playback/engineRegistry"
import { Player, type PlayerEvent } from "@/playback/player"
import ArrayQueue from "@/playback/queue/array"
import type { Queue, QueueEvent, RandomItemContext } from "@/playback/queue/base"
import { createEvent, type EventDispatch } from "@/utilities/events"

function mockItem(name: string, scheme = "magritte"): PlayableItem {
    return {
        kind: "song",
        id: `test:song:${name}`,
        title: name,
        endTime: 180,
        sources: [{ url: `${scheme}:///${name}`, mime_type: null }],
    }
}

const [a, b, c] = [mockItem("a"), mockItem("b"), mockItem("c")]

/** An engine which plays items whose sources use its scheme, driven by hand from tests */
class FakeEngine implements PlaybackEngine {
    readonly subscribe
    private readonly _dispatch: EventDispatch<PlaybackEngineEvent>

    elapsedTime: number | null = null
    totalTime: number | null = null
    skipsChapters = false

    constructor(readonly scheme = "magritte") {
        ;[this._dispatch, this.subscribe] = createEvent<PlaybackEngineEvent>({
            label: `FakeEngine(${scheme})`,
        })
    }

    /** Send an event from the engine, resolving once the player has handled it */
    emit(event: PlaybackEngineEvent): Promise<void> {
        return this._dispatch(event)
    }

    syncPlaybackModes = vi.fn(async () => {})
    syncVolume = vi.fn(async () => {})
    canEnqueue = vi.fn(async (item: PlayableItem) =>
        (item.sources ?? []).some((source) => source.url.startsWith(`${this.scheme}:`)),
    )
    enqueue = vi.fn(async (_options: PlaybackEngineEnqueueOptions) => {})
    skipPreviousItemChapter = vi.fn(async () => this.skipsChapters)
    skipNextItemChapter = vi.fn(async () => this.skipsChapters)
    getCurrentTime = vi.fn(async (): Promise<PlaybackTime> => ({
        elapsedTime: this.elapsedTime,
        totalTime: this.totalTime,
    }))
    seek = vi.fn(async () => {})
    pause = vi.fn(async () => {})
    resume = vi.fn(async () => {})
    stop = vi.fn(async () => {})
}

/** Stands in for the registry, which otherwise needs a running extension runtime */
class FakeEngineRegistry {
    readonly subscribe
    private readonly _dispatch: EventDispatch<PlaybackEngineRegistryEvent>

    constructor(public engines: FakeEngine[]) {
        ;[this._dispatch, this.subscribe] = createEvent<PlaybackEngineRegistryEvent>({
            label: "FakeEngineRegistry",
        })
    }

    async findPlaybackEngineFor(item: PlayableItem): Promise<PlaybackEngine | null> {
        for (const engine of this.engines) {
            if (await engine.canEnqueue(item)) {
                return engine
            }
        }
        return null
    }

    unregister(engine: FakeEngine): Promise<void> {
        this.engines = this.engines.filter((candidate) => candidate !== engine)
        return this._dispatch({ type: "playbackEngineUnregistered", engine })
    }
}

/** A queue which hands out whatever `randomItem` the test asks for */
class StubQueue implements Queue<PlayableItem> {
    readonly subscribe
    readonly dispatch: EventDispatch<QueueEvent>
    readonly inner: ArrayQueue<PlayableItem>
    randomItems: (PlayableItem | null)[] = []
    lastRandomContext: RandomItemContext<PlayableItem> | null = null

    constructor(items: PlayableItem[]) {
        ;[this.dispatch, this.subscribe] = createEvent<QueueEvent>({ label: "StubQueue" })
        this.inner = ArrayQueue.of(...items)
    }

    hasItem = (item: PlayableItem) => this.inner.hasItem(item)
    firstItem = () => this.inner.firstItem()
    lastItem = () => this.inner.lastItem()
    itemPreceding = (item: PlayableItem) => this.inner.itemPreceding(item)
    itemFollowing = (item: PlayableItem) => this.inner.itemFollowing(item)
    randomItem = vi.fn(async (context: RandomItemContext<PlayableItem>) => {
        this.lastRandomContext = context
        return this.randomItems.shift() ?? null
    })
    connect = vi.fn()
    disconnect = vi.fn()
}

interface Harness {
    readonly player: Player
    readonly engine: FakeEngine
    readonly registry: FakeEngineRegistry
    readonly events: PlayerEvent[]
}

function makeHarness(engines: FakeEngine[] = [new FakeEngine()]): Harness {
    const registry = new FakeEngineRegistry(engines)
    const player = new Player(registry as unknown as PlaybackEngineRegistry)
    const events: PlayerEvent[] = []
    player.subscribe((event) => {
        events.push(event)
    })
    return { player, engine: engines[0], registry, events }
}

/** The items an engine was asked to play, in order */
function enqueuedItems(engine: FakeEngine): PlayableItem[] {
    return engine.enqueue.mock.calls.map(([options]) => options.itemToPlay)
}

/** Let the player's subscribers, which it does not wait for, run */
async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0))
}

async function playFrom(harness: Harness, items: PlayableItem[], startingItem = items[0]) {
    await harness.player.replaceQueue({
        newQueue: ArrayQueue.of(...items),
        startingItem,
        playNow: true,
    })
}

beforeEach(() => {
    localStorage.clear()
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe("Player", () => {
    describe("initial state", () => {
        it("starts stopped with nothing playing", () => {
            const { player } = makeHarness()
            expect(player.playingItem).toBeNull()
            expect(player.playbackState).toBe("stopped")
            expect(player.playbackModes).toStrictEqual({ repeat: "off", shuffle: "off" })
        })

        it("restores the saved volume", () => {
            localStorage.setItem("player.volume", "0.25")
            const { player } = makeHarness()
            expect(player.volume).toBe(0.25)
        })

        it("does nothing for transport controls without an engine", async () => {
            const { player } = makeHarness()
            await expect(player.pause()).resolves.toBeUndefined()
            await expect(player.resume()).resolves.toBeUndefined()
            await expect(player.getCurrentTime()).resolves.toStrictEqual({
                elapsedTime: null,
                totalTime: null,
            })
        })
    })

    describe("#replaceQueue", () => {
        it("plays the starting item with the engine which can play it", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a, b, c], b)

            expect(harness.player.playingItem).toStrictEqual(b)
            expect(harness.engine.enqueue).toHaveBeenCalledWith({ itemToPlay: b, playNow: true })
        })

        it("passes playNow through to the engine", async () => {
            const harness = makeHarness()
            await harness.player.replaceQueue({
                newQueue: ArrayQueue.of(a),
                startingItem: a,
                playNow: false,
            })
            expect(harness.engine.enqueue).toHaveBeenCalledWith({ itemToPlay: a, playNow: false })
        })

        it("plays the first item when there is no starting item", async () => {
            const harness = makeHarness()
            await harness.player.replaceQueue({ newQueue: ArrayQueue.of(a, b, c) })
            expect(enqueuedItems(harness.engine)).toStrictEqual([a])
        })

        it("plays the first item of the new queue while something else is playing", async () => {
            const harness = makeHarness()
            const [x, y] = [mockItem("x"), mockItem("y")]
            await playFrom(harness, [x, y])

            await harness.player.replaceQueue({ newQueue: ArrayQueue.of(a, b, c) })
            expect(harness.player.playingItem).toStrictEqual(a)
        })

        it("plays nothing for an empty queue", async () => {
            const harness = makeHarness()
            await harness.player.replaceQueue({ newQueue: ArrayQueue.of() })
            expect(harness.engine.enqueue).not.toHaveBeenCalled()
            expect(harness.player.playingItem).toBeNull()
        })

        it("stops what was playing when the new queue is empty", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a, b])
            await harness.engine.emit({ type: "playbackStateDidChange", playbackState: "playing" })
            await settle()
            harness.events.length = 0

            await harness.player.replaceQueue({ newQueue: ArrayQueue.of() })
            await settle()
            expect(harness.player.playingItem).toBeNull()
            expect(harness.player.playbackState).toBe("stopped")
            expect(harness.events).toContainEqual({ type: "playingItemChanged" })
        })

        it("shuffles from the new queue while something else is playing", async () => {
            const harness = makeHarness()
            await harness.player.setPlaybackModes({ repeat: "off", shuffle: "on" })
            await playFrom(harness, [mockItem("x")])
            const queue = new StubQueue([a, b, c])
            queue.randomItems = [b]

            await harness.player.replaceQueue({ newQueue: queue })
            expect(harness.player.playingItem).toStrictEqual(b)
            // The old queue's item does not count as played in the new one
            await expect(queue.lastRandomContext!.getNumberOfPlayedItems()).resolves.toBe(0)
        })

        it("syncs modes and volume to an engine before it plays", async () => {
            const harness = makeHarness()
            await harness.player.setVolume(0.5)
            await harness.player.setPlaybackModes({ repeat: "all", shuffle: "off" })
            await playFrom(harness, [a])

            expect(harness.engine.syncVolume).toHaveBeenCalledWith(0.5)
            expect(harness.engine.syncPlaybackModes).toHaveBeenCalledWith({
                repeat: "all",
                shuffle: "off",
            })
            const enqueueOrder = harness.engine.enqueue.mock.invocationCallOrder[0]
            expect(harness.engine.syncVolume.mock.invocationCallOrder[0]).toBeLessThan(enqueueOrder)
            expect(harness.engine.syncPlaybackModes.mock.invocationCallOrder[0]).toBeLessThan(
                enqueueOrder,
            )
        })

        it("connects the new queue and disconnects the old one", async () => {
            const harness = makeHarness()
            const first = new StubQueue([a])
            const second = new StubQueue([b])
            await harness.player.replaceQueue({ newQueue: first, startingItem: a })
            expect(first.connect).toHaveBeenCalledTimes(1)

            await harness.player.replaceQueue({ newQueue: second, startingItem: b })
            expect(first.disconnect).toHaveBeenCalledTimes(1)
            expect(second.connect).toHaveBeenCalledTimes(1)
            expect(harness.player.queue).toBe(second)
        })

        it("announces the queue changed", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a])
            await settle()
            expect(harness.events).toContainEqual({ type: "queueDidChange" })
        })

        it("reports an error when no engine can play the item", async () => {
            const harness = makeHarness()
            const unplayable = mockItem("unplayable", "nowhere")
            await playFrom(harness, [unplayable])
            await settle()

            expect(harness.engine.enqueue).not.toHaveBeenCalled()
            expect(harness.events).toContainEqual({
                type: "encounteredError",
                error: expect.any(Error),
            })
        })

        it("stops the old engine when switching to another one", async () => {
            const local = new FakeEngine("magritte")
            const remote = new FakeEngine("remote")
            const harness = makeHarness([local, remote])
            const remoteItem = mockItem("remote", "remote")

            await playFrom(harness, [a])
            await playFrom(harness, [remoteItem])

            expect(local.stop).toHaveBeenCalled()
            expect(enqueuedItems(remote)).toStrictEqual([remoteItem])
        })

        it("ignores events from an engine it switched away from", async () => {
            const local = new FakeEngine("magritte")
            const remote = new FakeEngine("remote")
            const harness = makeHarness([local, remote])

            await playFrom(harness, [a])
            await playFrom(harness, [mockItem("remote", "remote")])
            await local.emit({ type: "playbackStateDidChange", playbackState: "playing" })

            expect(harness.player.playbackState).not.toBe("playing")
        })
    })

    describe("engine events", () => {
        it("tracks and forwards playback state changes", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a])
            await harness.engine.emit({ type: "playbackStateDidChange", playbackState: "playing" })
            await settle()

            expect(harness.player.playbackState).toBe("playing")
            expect(harness.events).toContainEqual({
                type: "playbackStateDidChange",
                playbackState: "playing",
            })
        })

        it("forwards errors", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a])
            const error = new Error("boom")
            await harness.engine.emit({ type: "encounteredError", error })
            await settle()
            expect(harness.events).toContainEqual({ type: "encounteredError", error })
        })

        it("plays the following item at the end of audio", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a, b, c])
            await harness.engine.emit({ type: "endOfAudio", lastItem: a })

            expect(harness.player.playingItem).toStrictEqual(b)
            expect(harness.engine.enqueue).toHaveBeenLastCalledWith({
                itemToPlay: b,
                playNow: true,
            })
        })

        it("stops after the last item", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a, b], b)
            await harness.engine.emit({ type: "endOfAudio", lastItem: b })
            await settle()

            expect(harness.player.playingItem).toBeNull()
            expect(harness.player.playbackState).toBe("stopped")
            expect(harness.engine.stop).toHaveBeenCalled()
            expect(harness.events).toContainEqual({ type: "endOfAudio", lastItem: b })
        })

        it("wraps around after the last item when repeating all", async () => {
            const harness = makeHarness()
            await harness.player.setPlaybackModes({ repeat: "all", shuffle: "off" })
            await playFrom(harness, [a, b], b)
            await harness.engine.emit({ type: "endOfAudio", lastItem: b })
            expect(harness.player.playingItem).toStrictEqual(a)
        })

        it("plays the same item again when repeating one", async () => {
            const harness = makeHarness()
            await harness.player.setPlaybackModes({ repeat: "one", shuffle: "off" })
            await playFrom(harness, [a, b])
            await harness.engine.emit({ type: "endOfAudio", lastItem: a })
            expect(enqueuedItems(harness.engine)).toStrictEqual([a, a])
        })
    })

    describe("queue events", () => {
        it("forwards changes to the current queue", async () => {
            const harness = makeHarness()
            const queue = ArrayQueue.of(a)
            await harness.player.replaceQueue({ newQueue: queue, startingItem: a })
            await settle()
            harness.events.length = 0

            await queue.push(b)
            await settle()
            expect(harness.events).toStrictEqual([{ type: "queueDidChange" }])
        })

        it("ignores changes to a queue it replaced", async () => {
            const harness = makeHarness()
            const old = ArrayQueue.of(a)
            await harness.player.replaceQueue({ newQueue: old, startingItem: a })
            await playFrom(harness, [b])
            await settle()
            harness.events.length = 0

            await old.push(c)
            await settle()
            expect(harness.events).toStrictEqual([])
        })
    })

    describe("#skipNext", () => {
        it("lets the engine skip a chapter first", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a, b])
            harness.engine.skipsChapters = true

            await expect(harness.player.skipNext()).resolves.toBe(true)
            expect(harness.player.playingItem).toStrictEqual(a)
        })

        it("plays the following item", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a, b])
            await expect(harness.player.skipNext()).resolves.toBe(true)
            expect(harness.player.playingItem).toStrictEqual(b)
        })

        it("keeps the player paused when it was paused", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a, b])
            await harness.engine.emit({ type: "playbackStateDidChange", playbackState: "paused" })

            await harness.player.skipNext()
            expect(harness.engine.enqueue).toHaveBeenLastCalledWith({
                itemToPlay: b,
                playNow: false,
            })
        })

        it("stops after the last item", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a, b], b)
            await expect(harness.player.skipNext()).resolves.toBe(false)
            expect(harness.player.playingItem).toBeNull()
        })

        it("moves on from an item even when repeating one", async () => {
            const harness = makeHarness()
            await harness.player.setPlaybackModes({ repeat: "one", shuffle: "off" })
            await playFrom(harness, [a, b])
            await harness.player.skipNext()
            expect(harness.player.playingItem).toStrictEqual(b)
        })
    })

    describe("#skipPrevious", () => {
        it("restarts the item when it is well underway", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a, b], b)
            harness.engine.elapsedTime = 30

            await expect(harness.player.skipPrevious()).resolves.toBe(true)
            expect(harness.engine.seek).toHaveBeenCalledWith(0)
            expect(harness.player.playingItem).toStrictEqual(b)
        })

        it("lets the engine skip a chapter first", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a, b], b)
            harness.engine.skipsChapters = true

            await expect(harness.player.skipPrevious()).resolves.toBe(true)
            expect(harness.player.playingItem).toStrictEqual(b)
        })

        it("plays the preceding item near the start of an item", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a, b], b)
            harness.engine.elapsedTime = 3

            await expect(harness.player.skipPrevious()).resolves.toBe(true)
            expect(harness.player.playingItem).toStrictEqual(a)
        })

        it("wraps around to the last item when repeating all", async () => {
            const harness = makeHarness()
            await harness.player.setPlaybackModes({ repeat: "all", shuffle: "off" })
            await playFrom(harness, [a, b, c])
            await harness.player.skipPrevious()
            expect(harness.player.playingItem).toStrictEqual(c)
        })

        it("moves back from an item even when repeating one", async () => {
            const harness = makeHarness()
            await harness.player.setPlaybackModes({ repeat: "one", shuffle: "off" })
            await playFrom(harness, [a, b], b)
            await harness.player.skipPrevious()
            expect(harness.player.playingItem).toStrictEqual(a)
        })

        it("plays the first item when nothing is playing", async () => {
            const harness = makeHarness()
            await harness.player.replaceQueue({ newQueue: ArrayQueue.of(a, b), startingItem: a })
            await harness.player.stop()

            await expect(harness.player.skipPrevious()).resolves.toBe(true)
            expect(harness.player.playingItem).toStrictEqual(a)
        })
    })

    describe("shuffle", () => {
        it("plays a random item next", async () => {
            const harness = makeHarness()
            await harness.player.setPlaybackModes({ repeat: "off", shuffle: "on" })
            const queue = new StubQueue([a, b, c])
            queue.randomItems = [c]
            await harness.player.replaceQueue({ newQueue: queue, startingItem: a })

            await harness.player.skipNext()
            expect(harness.player.playingItem).toStrictEqual(c)
        })

        it("tells the queue which items were already played", async () => {
            const harness = makeHarness()
            await harness.player.setPlaybackModes({ repeat: "off", shuffle: "on" })
            const queue = new StubQueue([a, b, c])
            queue.randomItems = [c, b]
            await harness.player.replaceQueue({ newQueue: queue, startingItem: a })
            await harness.player.skipNext()
            await harness.player.skipNext()

            const context = queue.lastRandomContext!
            await expect(context.getNumberOfPlayedItems()).resolves.toBe(2)
            await expect(context.hasPlayedItem(a)).resolves.toBe(true)
            await expect(context.hasPlayedItem(c)).resolves.toBe(true)
            await expect(context.hasPlayedItem(b)).resolves.toBe(false)
        })

        it("gives the queue random indices within range", async () => {
            const harness = makeHarness()
            await harness.player.setPlaybackModes({ repeat: "off", shuffle: "on" })
            const queue = new StubQueue([a])
            await harness.player.replaceQueue({ newQueue: queue, startingItem: a })
            await harness.player.skipNext()

            const context = queue.lastRandomContext!
            for (let attempt = 0; attempt < 50; attempt++) {
                const index = await context.randomIndex(3)
                expect(index).toBeGreaterThanOrEqual(0)
                expect(index).toBeLessThan(3)
                expect(Number.isInteger(index)).toBe(true)
            }
        })

        it("goes back through the items it played", async () => {
            const harness = makeHarness()
            await harness.player.setPlaybackModes({ repeat: "off", shuffle: "on" })
            const queue = new StubQueue([a, b, c])
            queue.randomItems = [c, b]
            await harness.player.replaceQueue({ newQueue: queue, startingItem: a })
            await harness.player.skipNext()
            await harness.player.skipNext()

            await harness.player.skipPrevious()
            expect(harness.player.playingItem).toStrictEqual(c)
            await harness.player.skipPrevious()
            expect(harness.player.playingItem).toStrictEqual(a)
        })

        it("forgets the played items when the queue is replaced", async () => {
            const harness = makeHarness()
            await harness.player.setPlaybackModes({ repeat: "off", shuffle: "on" })
            const first = new StubQueue([a, b])
            first.randomItems = [b]
            await harness.player.replaceQueue({ newQueue: first, startingItem: a })
            await harness.player.skipNext()

            const second = new StubQueue([a, b])
            second.randomItems = [a]
            await harness.player.replaceQueue({ newQueue: second, startingItem: b })
            await harness.player.skipNext()

            const context = second.lastRandomContext!
            await expect(context.hasPlayedItem(a)).resolves.toBe(false)
        })
    })

    describe("#seek", () => {
        it("seeks the engine and announces the old and new times", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a])
            harness.engine.elapsedTime = 12
            harness.engine.totalTime = 180

            await harness.player.seek(60)
            await settle()
            expect(harness.engine.seek).toHaveBeenCalledWith(60)
            expect(harness.events).toContainEqual({
                type: "playingItemSeeked",
                totalTime: 180,
                oldTime: 12,
                newTime: 60,
            })
        })
    })

    describe("#pause and #resume", () => {
        it("pass through to the engine", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a])
            await harness.player.pause()
            await harness.player.resume()
            expect(harness.engine.pause).toHaveBeenCalledTimes(1)
            expect(harness.engine.resume).toHaveBeenCalledTimes(1)
        })
    })

    describe("#stop", () => {
        it("stops the engine and clears what is playing", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a])
            await harness.engine.emit({ type: "playbackStateDidChange", playbackState: "playing" })

            await harness.player.stop()
            await settle()
            expect(harness.engine.stop).toHaveBeenCalled()
            expect(harness.player.playingItem).toBeNull()
            expect(harness.player.playbackState).toBe("stopped")
            expect(harness.events).toContainEqual({ type: "playingItemChanged" })
        })
    })

    describe("#setVolume", () => {
        it("clamps, saves, and syncs the volume", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a])

            await harness.player.setVolume(1.5)
            await settle()
            expect(harness.player.volume).toBe(1)
            expect(localStorage.getItem("player.volume")).toBe("1")
            expect(harness.engine.syncVolume).toHaveBeenLastCalledWith(1)
            expect(harness.events).toContainEqual({ type: "volumeDidChange", volume: 1 })

            await harness.player.setVolume(-1)
            expect(harness.player.volume).toBe(0)
        })
    })

    describe("#setPlaybackModes", () => {
        it("accepts an updater and syncs the engine", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a])

            await harness.player.setPlaybackModes((modes) => ({ ...modes, shuffle: "on" }))
            await settle()
            expect(harness.player.playbackModes).toStrictEqual({ repeat: "off", shuffle: "on" })
            expect(harness.engine.syncPlaybackModes).toHaveBeenLastCalledWith({
                repeat: "off",
                shuffle: "on",
            })
            expect(harness.events).toContainEqual({
                type: "playbackModesDidChange",
                modes: { repeat: "off", shuffle: "on" },
            })
        })
    })

    describe("engine unregistration", () => {
        it("stops when the active engine goes away", async () => {
            const harness = makeHarness()
            await playFrom(harness, [a])
            await harness.engine.emit({ type: "playbackStateDidChange", playbackState: "playing" })

            await harness.registry.unregister(harness.engine)
            expect(harness.player.playingItem).toBeNull()
            expect(harness.player.playbackState).toBe("stopped")

            // Transport controls no longer reach the engine
            await harness.player.pause()
            expect(harness.engine.pause).not.toHaveBeenCalled()
        })

        it("ignores other engines going away", async () => {
            const local = new FakeEngine("magritte")
            const remote = new FakeEngine("remote")
            const harness = makeHarness([local, remote])
            await playFrom(harness, [a])

            await harness.registry.unregister(remote)
            expect(harness.player.playingItem).toStrictEqual(a)
        })
    })
})
