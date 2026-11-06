import type { UIEventsKeyPress } from "@magritte/sdk"
import { afterEach, describe, expect, it, vi } from "vitest"

import { HotKeyDispatcher } from "./hotKeyDispatcher"

function keyPress(key: string, modifiers: Partial<UIEventsKeyPress> = {}): UIEventsKeyPress {
    return { key, metaKey: false, ctrlKey: false, shiftKey: false, ...modifiers }
}

function createDispatcher(platform: string): HotKeyDispatcher {
    vi.stubGlobal("navigator", { platform })
    return new HotKeyDispatcher()
}

describe("HotKeyDispatcher", () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    describe("#modifierKey", () => {
        it.each([
            ["MacIntel", "meta"],
            ["iPhone", "meta"],
            ["Win32", "ctrl"],
            ["Linux x86_64", "ctrl"],
        ])("should be determined from platform %s", (platform, expected) => {
            expect(createDispatcher(platform).modifierKey).toBe(expected)
        })
    })

    describe("#register", () => {
        it("should add handlers in registration order", () => {
            const dispatcher = createDispatcher("MacIntel")
            const first = vi.fn()
            const second = vi.fn()
            dispatcher.register({ key: "k" }, first)
            dispatcher.register({ key: "j" }, second)

            expect(dispatcher.handlers).toEqual([
                [{ key: "k" }, first],
                [{ key: "j" }, second],
            ])
        })

        it("should replace the handlers array rather than mutate it", () => {
            const dispatcher = createDispatcher("MacIntel")
            const before = dispatcher.handlers
            const unregister = dispatcher.register({ key: "k" }, () => true)
            const afterRegister = dispatcher.handlers
            unregister()

            expect(before).toHaveLength(0)
            expect(afterRegister).not.toBe(before)
            expect(afterRegister).toHaveLength(1)
            expect(dispatcher.handlers).not.toBe(afterRegister)
        })
    })

    describe("unregister", () => {
        it("should remove the handler", () => {
            const dispatcher = createDispatcher("MacIntel")
            const handler = vi.fn().mockReturnValue(true)
            const unregister = dispatcher.register({ key: "k" }, handler)
            unregister()

            expect(dispatcher.handlers).toHaveLength(0)
            expect(dispatcher.dispatch(keyPress("k", { metaKey: true }))).toBe(false)
            expect(handler).not.toHaveBeenCalled()
        })

        it("should be a no-op when called more than once", () => {
            const dispatcher = createDispatcher("MacIntel")
            const unregister = dispatcher.register({ key: "k" }, () => true)
            dispatcher.register({ key: "j" }, () => true)

            unregister()
            unregister()

            expect(dispatcher.handlers).toHaveLength(1)
        })

        it("should only remove one registration of an identical key and handler", () => {
            const dispatcher = createDispatcher("MacIntel")
            const key = { key: "k" }
            const handler = () => true
            const unregisterFirst = dispatcher.register(key, handler)
            dispatcher.register(key, handler)
            unregisterFirst()

            expect(dispatcher.handlers).toEqual([[key, handler]])
        })

        it("should match registrations by key identity", () => {
            const dispatcher = createDispatcher("MacIntel")
            const handler = () => true
            const unregister = dispatcher.register({ key: "k" }, handler)
            const otherKey = { key: "k" }
            dispatcher.register(otherKey, handler)
            unregister()

            expect(dispatcher.handlers).toHaveLength(1)
            expect(dispatcher.handlers[0][0]).toBe(otherKey)
        })
    })

    describe("#dispatch", () => {
        it("should return false with no handlers", () => {
            const dispatcher = createDispatcher("MacIntel")
            expect(dispatcher.dispatch(keyPress("k", { metaKey: true }))).toBe(false)
        })

        it("should ignore handlers for other keys", () => {
            const dispatcher = createDispatcher("MacIntel")
            const handler = vi.fn().mockReturnValue(true)
            dispatcher.register({ key: "j" }, handler)

            expect(dispatcher.dispatch(keyPress("k", { metaKey: true }))).toBe(false)
            expect(handler).not.toHaveBeenCalled()
        })

        it("should match keys case-sensitively", () => {
            const dispatcher = createDispatcher("MacIntel")
            const handler = vi.fn().mockReturnValue(true)
            dispatcher.register({ key: "k" }, handler)

            expect(dispatcher.dispatch(keyPress("K", { metaKey: true }))).toBe(false)
            expect(handler).not.toHaveBeenCalled()
        })

        describe("with the meta modifier (Mac)", () => {
            it("should require meta by default", () => {
                const dispatcher = createDispatcher("MacIntel")
                const handler = vi.fn().mockReturnValue(true)
                dispatcher.register({ key: "k" }, handler)

                expect(dispatcher.dispatch(keyPress("k"))).toBe(false)
                expect(dispatcher.dispatch(keyPress("k", { ctrlKey: true }))).toBe(false)
                expect(handler).not.toHaveBeenCalled()

                expect(dispatcher.dispatch(keyPress("k", { metaKey: true }))).toBe(true)
                expect(handler).toHaveBeenCalledTimes(1)
            })

            it("should require meta when requiresModifier is true", () => {
                const dispatcher = createDispatcher("MacIntel")
                const handler = vi.fn().mockReturnValue(true)
                dispatcher.register({ key: "k", requiresModifier: true }, handler)

                expect(dispatcher.dispatch(keyPress("k"))).toBe(false)
                expect(dispatcher.dispatch(keyPress("k", { metaKey: true }))).toBe(true)
            })
        })

        describe("with the ctrl modifier (non-Mac)", () => {
            it("should require ctrl by default", () => {
                const dispatcher = createDispatcher("Win32")
                const handler = vi.fn().mockReturnValue(true)
                dispatcher.register({ key: "k" }, handler)

                expect(dispatcher.dispatch(keyPress("k"))).toBe(false)
                expect(dispatcher.dispatch(keyPress("k", { metaKey: true }))).toBe(false)
                expect(handler).not.toHaveBeenCalled()

                expect(dispatcher.dispatch(keyPress("k", { ctrlKey: true }))).toBe(true)
                expect(handler).toHaveBeenCalledTimes(1)
            })
        })

        describe("when requiresModifier is false", () => {
            it("should fire without the modifier", () => {
                const dispatcher = createDispatcher("MacIntel")
                const handler = vi.fn().mockReturnValue(true)
                dispatcher.register({ key: "Escape", requiresModifier: false }, handler)

                expect(dispatcher.dispatch(keyPress("Escape"))).toBe(true)
                expect(handler).toHaveBeenCalledTimes(1)
            })

            it("should also fire with the modifier", () => {
                const dispatcher = createDispatcher("MacIntel")
                const handler = vi.fn().mockReturnValue(true)
                dispatcher.register({ key: "Escape", requiresModifier: false }, handler)

                expect(dispatcher.dispatch(keyPress("Escape", { metaKey: true }))).toBe(true)
                expect(handler).toHaveBeenCalledTimes(1)
            })
        })

        it("should ignore shift", () => {
            const dispatcher = createDispatcher("MacIntel")
            const handler = vi.fn().mockReturnValue(true)
            dispatcher.register({ key: "k" }, handler)

            expect(dispatcher.dispatch(keyPress("k", { metaKey: true, shiftKey: true }))).toBe(true)
        })

        it("should stop at the first handler that returns true", () => {
            const dispatcher = createDispatcher("MacIntel")
            const first = vi.fn().mockReturnValue(true)
            const second = vi.fn().mockReturnValue(true)
            dispatcher.register({ key: "k" }, first)
            dispatcher.register({ key: "k" }, second)

            expect(dispatcher.dispatch(keyPress("k", { metaKey: true }))).toBe(true)
            expect(first).toHaveBeenCalledTimes(1)
            expect(second).not.toHaveBeenCalled()
        })

        it("should fall through to later handlers when a handler returns false", () => {
            const dispatcher = createDispatcher("MacIntel")
            const first = vi.fn().mockReturnValue(false)
            const second = vi.fn().mockReturnValue(true)
            dispatcher.register({ key: "k" }, first)
            dispatcher.register({ key: "k" }, second)

            expect(dispatcher.dispatch(keyPress("k", { metaKey: true }))).toBe(true)
            expect(first).toHaveBeenCalledTimes(1)
            expect(second).toHaveBeenCalledTimes(1)
        })

        it("should return false when every matching handler declines", () => {
            const dispatcher = createDispatcher("MacIntel")
            const first = vi.fn().mockReturnValue(false)
            const second = vi.fn().mockReturnValue(false)
            dispatcher.register({ key: "k" }, first)
            dispatcher.register({ key: "k" }, second)

            expect(dispatcher.dispatch(keyPress("k", { metaKey: true }))).toBe(false)
            expect(first).toHaveBeenCalledTimes(1)
            expect(second).toHaveBeenCalledTimes(1)
        })

        it("should skip non-matching handlers to reach a matching one", () => {
            const dispatcher = createDispatcher("MacIntel")
            const modifierOnly = vi.fn().mockReturnValue(true)
            const bare = vi.fn().mockReturnValue(true)
            dispatcher.register({ key: "k" }, modifierOnly)
            dispatcher.register({ key: "k", requiresModifier: false }, bare)

            expect(dispatcher.dispatch(keyPress("k"))).toBe(true)
            expect(modifierOnly).not.toHaveBeenCalled()
            expect(bare).toHaveBeenCalledTimes(1)
        })
    })
})
