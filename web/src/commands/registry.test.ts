import { describe, expect, it, vi } from "vitest"

import { CommandRegistry } from "./registry"

describe("CommandRegistry", () => {
    describe("#add", () => {
        it("should not allow command to be duplicate of already existing command", () => {
            const subject = new CommandRegistry()
            expect(() =>
                subject.add({
                    id: "foo",
                    searchTerms: "foo",
                    requiredInputKinds: [],
                    present: async () => ({ displayName: "", disabled: false }),
                    execute: async () => {},
                }),
            ).not.toThrow()

            const subscriber = vi.fn()
            subject.$events(subscriber)

            expect(() =>
                subject.add({
                    id: "foo",
                    searchTerms: "foo",
                    requiredInputKinds: [],
                    present: async () => ({ displayName: "", disabled: false }),
                    execute: async () => {},
                }),
            ).toThrow()

            expect(subscriber).not.toHaveBeenCalledWith({ type: "registeredCommandsDidChange" })
        })

        it("should not allow duplicate commands to be passed", () => {
            const subject = new CommandRegistry()
            expect(() =>
                subject.add(
                    {
                        id: "foo",
                        searchTerms: "foo",
                        requiredInputKinds: [],
                        present: async () => ({ displayName: "", disabled: false }),
                        execute: async () => {},
                    },
                    {
                        id: "foo",
                        searchTerms: "foo",
                        requiredInputKinds: [],
                        present: async () => ({ displayName: "", disabled: false }),
                        execute: async () => {},
                    },
                ),
            ).toThrow()
        })

        it("should post registeredCommandsDidChange event if command is added", () => {
            const subject = new CommandRegistry()
            const subscriber = vi.fn()
            subject.$events(subscriber)

            expect(() =>
                subject.add({
                    id: "foo",
                    searchTerms: "foo",
                    requiredInputKinds: [],
                    present: async () => ({ displayName: "", disabled: false }),
                    execute: async () => {},
                }),
            ).not.toThrow()

            expect(subscriber).toHaveBeenCalledWith({ type: "registeredCommandsDidChange" })
        })
    })

    describe("#remove", () => {
        it("should post registeredCommandsDidChange event if command is removed", () => {
            const subject = new CommandRegistry()
            expect(() =>
                subject.add({
                    id: "foo",
                    searchTerms: "foo",
                    requiredInputKinds: [],
                    present: async () => ({ displayName: "", disabled: false }),
                    execute: async () => {},
                }),
            ).not.toThrow()

            const subscriber = vi.fn()
            subject.$events(subscriber)

            expect(() =>
                subject.remove({
                    id: "foo",
                    searchTerms: "foo",
                    requiredInputKinds: [],
                    present: async () => ({ displayName: "", disabled: false }),
                    execute: async () => {},
                }),
            ).not.toThrow()

            expect(subscriber).toHaveBeenCalledWith({ type: "registeredCommandsDidChange" })
        })

        it("should not post registeredCommandsDidChange event if command is not removed", () => {
            const subject = new CommandRegistry()
            const subscriber = vi.fn()
            subject.$events(subscriber)

            expect(() =>
                subject.remove({
                    id: "foo",
                    searchTerms: "foo",
                    requiredInputKinds: [],
                    present: async () => ({ displayName: "", disabled: false }),
                    execute: async () => {},
                }),
            ).not.toThrow()

            expect(subscriber).not.toHaveBeenCalledWith({ type: "registeredCommandsDidChange" })
        })

        it("should keep all commands and lookups current when adding after a removal", () => {
            const subject = new CommandRegistry()
            const command = (id: string) => ({
                id,
                searchTerms: id,
                requiredInputKinds: [],
                present: async () => ({ displayName: "", disabled: false }),
                execute: async () => {},
            })

            subject.add(command("foo"), command("bar"))
            subject.removeByID("bar")
            subject.add(command("baz"))

            expect(subject.all.map((c) => c.id)).toEqual(["foo", "baz"])
            expect(subject.getByID("bar")).toBeUndefined()
            expect(subject.getByID("baz")?.id).toBe("baz")
            expect(subject.search("baz").map((c) => c.id)).toEqual(["baz"])
        })
    })
})
