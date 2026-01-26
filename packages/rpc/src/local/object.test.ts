import { describe, it, expect } from "vitest"
import z4 from "zod/v4"

import { implement, protocol } from "@/base/protocol"

import { LocalObject } from "./object"

const Arithmetic = protocol("Arithmetic", {
    add: { input: z4.object({ a: z4.number(), b: z4.number() }), output: z4.number() },
    subtract: { input: z4.object({ a: z4.number(), b: z4.number() }), output: z4.number() },
})
const ArithmeticImplementation = implement(Arithmetic, {
    async add({ a, b }) {
        return a + b
    },
    async subtract({ a, b }) {
        return a - b
    },
})

const Inspectable = protocol("Inspectable", {
    inspect: { input: z4.any(), output: z4.string() },
})
const InspectableImplementation = implement(Inspectable, {
    async inspect() {
        return "inspectable"
    },
})

describe("LocalObject", () => {
    describe("#inspect", () => {
        it("should return the addresses of immediate descendants", async () => {
            const root = new LocalObject(
                "root",
                [],
                [
                    new LocalObject("library", [], []),
                    new LocalObject(
                        "player",
                        [],
                        [
                            new LocalObject("appleMusicEngine", [], []),
                            new LocalObject("webEngine", [], []),
                        ],
                    ),
                ],
            )
            await expect(root.inspect()).resolves.toStrictEqual([["library"], ["player"]])
        })

        it("should return the addresses of all descendants recursively", async () => {
            const root = new LocalObject(
                "root",
                [],
                [
                    new LocalObject("library", [], []),
                    new LocalObject(
                        "player",
                        [],
                        [
                            new LocalObject("appleMusicEngine", [], []),
                            new LocalObject("webEngine", [], []),
                        ],
                    ),
                ],
            )
            await expect(root.inspect({ recursive: true })).resolves.toStrictEqual([
                ["library"],
                ["player"],
                ["player", "appleMusicEngine"],
                ["player", "webEngine"],
            ])
        })
    })

    describe("#find", () => {
        it("should return the root object", async () => {
            const root = new LocalObject("root", [], [])
            await expect(root.find([])).resolves.toBe(root)
        })

        it("should traverse any number of levels", async () => {
            const root = new LocalObject(
                "root",
                [],
                [
                    new LocalObject(
                        "library",
                        [],
                        [
                            new LocalObject(
                                "player",
                                [],
                                [
                                    new LocalObject("appleMusicEngine", [], []),
                                    new LocalObject("webEngine", [], []),
                                ],
                            ),
                        ],
                    ),
                ],
            )
            await expect(root.find(["library"])).resolves.toStrictEqual(
                expect.objectContaining({ name: "library" }),
            )
            await expect(root.find(["library", "player"])).resolves.toStrictEqual(
                expect.objectContaining({ name: "player" }),
            )

            await expect(
                root.find(["library", "player", "appleMusicEngine"]),
            ).resolves.toStrictEqual(expect.objectContaining({ name: "appleMusicEngine" }))
        })
    })

    describe("#conformsToProtocol", () => {
        it("should return true if the object conforms to the protocol", async () => {
            const subject = new LocalObject("root", [InspectableImplementation], [])
            await expect(subject.conformsToProtocol(Inspectable.name)).resolves.toBe(true)
        })

        it("should return false if the object does not conform to the protocol", async () => {
            const subject = new LocalObject("root", [InspectableImplementation], [])
            await expect(subject.conformsToProtocol(Arithmetic.name)).resolves.toBe(false)
        })
    })

    describe("#invoke", () => {
        it("should be possible to invoke a method on any implemented protocol", async () => {
            const subject = new LocalObject(
                "root",
                [InspectableImplementation, ArithmeticImplementation],
                [],
            )
            await expect(
                subject.invoke(InspectableImplementation.name, "inspect", undefined),
            ).resolves.toStrictEqual("inspectable")
            await expect(
                subject.invoke(ArithmeticImplementation.name, "add", { a: 12, b: 12 }),
            ).resolves.toStrictEqual(24)
            await expect(
                subject.invoke(ArithmeticImplementation.name, "subtract", { a: 20, b: 5 }),
            ).resolves.toStrictEqual(15)
        })
    })
})
