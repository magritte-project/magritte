import { describe, expect, it } from "vitest"
import z4 from "zod/v4"

import { allCommandInputsOf, CommandInput, onlyCommandInputOf, onlyOne } from "./inputs"

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

const INPUTS: readonly CommandInput[] = [
    {
        kind: "library",
        id: 1,
    } satisfies z4.infer<typeof TestLibraryInput>,
    {
        kind: "library.song",
        id: 1,
    } satisfies z4.infer<typeof TestLibrarySongInput>,
    {
        kind: "library.song",
        id: 2,
    } satisfies z4.infer<typeof TestLibrarySongInput>,
    {
        kind: "user.session",
        id: onlyOne,
    } satisfies z4.infer<typeof TestUserSessionInput>,
]

describe("inputs", () => {
    describe("#allCommandInputsOf", () => {
        it("should return only inputs which match the given kind", () => {
            expect(allCommandInputsOf(INPUTS, TestLibraryInput)).toHaveLength(1)
            expect(allCommandInputsOf(INPUTS, TestLibrarySongInput)).toHaveLength(2)
            expect(allCommandInputsOf(INPUTS, TestUserSessionInput)).toHaveLength(1)
        })
    })

    describe("#onlyCommandInputOf", () => {
        it("should return the only input when there is exactly one", () => {
            expect(() => onlyCommandInputOf(INPUTS, TestUserSessionInput)).not.toThrow()
        })

        it("should throw when there is more than one input", () => {
            expect(() =>
                onlyCommandInputOf(
                    [
                        {
                            kind: "user.session",
                            id: onlyOne,
                        } satisfies z4.infer<typeof TestUserSessionInput>,
                        {
                            kind: "user.session",
                            id: onlyOne,
                        } satisfies z4.infer<typeof TestUserSessionInput>,
                    ],
                    TestUserSessionInput,
                ),
            ).toThrow()
        })

        it("should throw when there is no input", () => {
            expect(() => onlyCommandInputOf([], TestUserSessionInput)).toThrow()
        })
    })
})
