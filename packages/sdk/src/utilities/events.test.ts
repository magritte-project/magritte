import { describe, expect, it, vi } from "vitest"

import { createEvent } from "./events"

describe("events", () => {
    it("should notify active subscribers", async () => {
        const [sink, source] = createEvent<number>()
        const firstCallback = vi.fn().mockResolvedValue(undefined)
        const firstSubscriber = source.subscribe(firstCallback)
        const secondCallback = vi.fn().mockResolvedValue(undefined)
        source.subscribe(secondCallback)
        firstSubscriber.unsubscribe()
        await sink.dispatch(42)

        expect(vi.mocked(firstCallback)).not.toHaveBeenCalled()
        expect(vi.mocked(secondCallback)).toHaveBeenCalled()
    })
})
