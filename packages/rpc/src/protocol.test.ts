import { describe, expect, it } from "vitest"
import z4 from "zod/v4"

import { LocalObject } from "./localObject.js"

import { cast, implement, protocol, tryCast } from "./protocol"

const Arithmetic = protocol("Arithmetic", {
    add: { input: z4.object({ a: z4.number(), b: z4.number() }), output: z4.number() },
    subtract: { input: z4.object({ a: z4.number(), b: z4.number() }), output: z4.number() },
    defective: { input: z4.any(), output: z4.number() },
})
const ArithmeticImplementation = implement(Arithmetic, {
    async add({ a, b }) {
        return a + b
    },
    async subtract({ a, b }) {
        return a - b
    },
    async defective() {
        return "42" as unknown as number
    },
})

describe("Protocol", () => {
    describe("#implement", () => {
        it("should implement the protocol", () => {
            expect(ArithmeticImplementation).toStrictEqual({
                name: "Arithmetic",
                vtable: expect.objectContaining({
                    add: expect.any(Function),
                    subtract: expect.any(Function),
                }),
            })
        })

        it("should enforce input schema", async () => {
            await expect(
                async () => await ArithmeticImplementation.vtable.add({ z: "hi", w: [] }),
            ).rejects.toThrow()
        })

        it("should enforce output schema", async () => {
            await expect(
                async () => await ArithmeticImplementation.vtable.defective(undefined),
            ).rejects.toThrow()
        })
    })

    describe("#tryCast", async () => {
        it("should return a functional proxy on success", async () => {
            const object = new LocalObject("root", [ArithmeticImplementation])
            const proxy = await tryCast(Arithmetic, object)
            expect(proxy).not.toBeNull()
            expect(proxy).toStrictEqual(
                expect.objectContaining({
                    add: expect.any(Function),
                    subtract: expect.any(Function),
                }),
            )
            expect(await proxy!.add({ a: 1, b: 2 })).toBe(3)
            expect(await proxy!.subtract({ a: 1, b: 2 })).toBe(-1)
        })

        it("should return null on failure", async () => {
            const object = new LocalObject("root", [])
            const proxy = await tryCast(Arithmetic, object)
            expect(proxy).toBeNull()
        })
    })

    describe("cast", async () => {
        it("should return a functional proxy on success", async () => {
            const object = new LocalObject("root", [ArithmeticImplementation])
            const proxy = await cast(Arithmetic, object)
            expect(proxy).toStrictEqual(
                expect.objectContaining({
                    add: expect.any(Function),
                    subtract: expect.any(Function),
                }),
            )
            expect(await proxy.add({ a: 1, b: 2 })).toBe(3)
            expect(await proxy.subtract({ a: 1, b: 2 })).toBe(-1)
        })

        it("should throw an error on failure", async () => {
            const object = new LocalObject("root", [])
            await expect(async () => await cast(Arithmetic, object)).rejects.toThrow()
        })
    })
})
