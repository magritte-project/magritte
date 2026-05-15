import { CommandInput, SingletonCommandInput, singletonInputID } from "@magritte/sdk/host"
import { describe, expect, it, vi } from "vitest"
import z4 from "zod"

import { CommandInputs } from "./base"

const TestLibraryInput = CommandInput.extend({
    kind: z4.literal("library"),
})
const TestLibrarySongInput = CommandInput.extend({
    kind: z4.literal("library.song"),
})
const TestUserSessionInput = SingletonCommandInput.extend({
    kind: z4.literal("user.session"),
})

describe("CommandInputs", () => {
    describe("#add", () => {
        it("should allow adding inputs with different ids but same kinds", () => {
            const subject = new CommandInputs()
            expect(() => subject.add({ kind: "library", id: 1 })).not.toThrow()
            expect(() => subject.add({ kind: "library", id: 2 })).not.toThrow()
            expect(() => subject.add({ kind: "library", id: 3 })).not.toThrow()

            expect(subject.allOf("library", TestLibraryInput)).toHaveLength(3)
        })

        it("should allow adding inputs with same id but different kinds", () => {
            const subject = new CommandInputs()
            expect(() => subject.add({ kind: "library", id: 1 })).not.toThrow()
            expect(() => subject.add({ kind: "library.song", id: 1 })).not.toThrow()
            expect(subject.allOf("library", TestLibraryInput)).toHaveLength(1)
            expect(subject.allOf("library.song", TestLibrarySongInput)).toHaveLength(1)
        })

        it("should reject duplicate inputs with same id and kind", () => {
            const subject = new CommandInputs()
            expect(() => subject.add({ kind: "library", id: 1 })).not.toThrow()
            expect(() => subject.add({ kind: "library", id: 1 })).toThrow()
        })

        it("should allow replacing singleton inputs with same id and kind", () => {
            const subject = new CommandInputs()
            expect(() =>
                subject.add({ kind: "user.session", id: singletonInputID, args: { token: "123" } }),
            ).not.toThrow()
            expect(() =>
                subject.add({ kind: "user.session", id: singletonInputID, args: { token: "456" } }),
            ).not.toThrow()
            expect(subject.only("user.session", TestUserSessionInput)).toEqual(
                expect.objectContaining({ args: { token: "456" } }),
            )
        })

        it("should post a commandInputsDidChange event when an input", () => {
            const subject = new CommandInputs()
            const subscriber = vi.fn()
            subject.$events.subscribe(subscriber)

            subject.add({ kind: "library", id: 1 })

            expect(subscriber).toHaveBeenCalledWith({ type: "commandInputsDidChange" })
        })
    })

    describe("#remove", () => {
        it("should remove the input if it exists", () => {
            const subject = new CommandInputs()
            const subscriber = vi.fn()
            subject.$events.subscribe(subscriber)

            subject.add({ kind: "library", id: 1 })
            subject.remove({ kind: "library", id: 1 })
            expect(subject.allOf("library", TestLibraryInput)).toHaveLength(0)

            expect(subscriber).toHaveBeenCalledWith({ type: "commandInputsDidChange" })
        })

        it("should not post a commandInputsDidChange event when removing an input that does not exist", () => {
            const subject = new CommandInputs()
            const subscriber = vi.fn()
            subject.$events.subscribe(subscriber)

            expect(() => subject.remove({ kind: "library", id: 1 })).not.toThrow()

            expect(subscriber).not.toHaveBeenCalledWith({ type: "commandInputsDidChange" })
        })
    })
})
