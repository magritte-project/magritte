import { CommandInput, onlyOne } from "@magritte/sdk"
import { describe, expect, it, vi } from "vitest"
import z4 from "zod"

import { CommandInputs } from "./base"

const TestLibraryInput = CommandInput.extend({
    kind: z4.literal("library").readonly(),
})
const TestLibrarySongInput = CommandInput.extend({
    kind: z4.literal("library.song").readonly(),
})
const TestUserSessionInput = CommandInput.extend({
    kind: z4.literal("user.session").readonly(),
    id: z4.literal(onlyOne).readonly(),
})

describe("CommandInputs", () => {
    describe("#add", () => {
        it("should allow adding inputs with different ids but same kinds", () => {
            const subject = new CommandInputs()
            expect(() => subject.add({ kind: "library", id: 1 })).not.toThrow()
            expect(() => subject.add({ kind: "library", id: 2 })).not.toThrow()
            expect(() => subject.add({ kind: "library", id: 3 })).not.toThrow()

            expect(subject.allOf(TestLibraryInput)).toHaveLength(3)
        })

        it("should allow adding inputs with same id but different kinds", () => {
            const subject = new CommandInputs()
            expect(() => subject.add({ kind: "library", id: 1 })).not.toThrow()
            expect(() => subject.add({ kind: "library.song", id: 1 })).not.toThrow()
            expect(subject.allOf(TestLibraryInput)).toHaveLength(1)
            expect(subject.allOf(TestLibrarySongInput)).toHaveLength(1)
        })

        it("should tolerate duplicate inputs with same id and kind", () => {
            const subject = new CommandInputs()
            expect(() => subject.add({ kind: "library", id: 1 })).not.toThrow()
            expect(() => subject.add({ kind: "library", id: 1 })).not.toThrow()
        })

        it("should allow replacing singleton inputs with same id and kind", () => {
            const subject = new CommandInputs()
            expect(() =>
                subject.add({ kind: "user.session", id: onlyOne, args: { token: "123" } }),
            ).not.toThrow()
            expect(() =>
                subject.add({ kind: "user.session", id: onlyOne, args: { token: "456" } }),
            ).not.toThrow()
            expect(subject.only(TestUserSessionInput)).toEqual(
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
            subject.remove("library", 1)
            expect(subject.allOf(TestLibraryInput)).toHaveLength(0)

            expect(subscriber).toHaveBeenCalledWith({ type: "commandInputsDidChange" })
        })

        it("should not post a commandInputsDidChange event when removing an input that does not exist", () => {
            const subject = new CommandInputs()
            const subscriber = vi.fn()
            subject.$events.subscribe(subscriber)

            expect(() => subject.remove("library", 1)).not.toThrow()

            expect(subscriber).not.toHaveBeenCalledWith({ type: "commandInputsDidChange" })
        })
    })
})
