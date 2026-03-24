import { describe, expect, it } from "vitest"

import { LocalObject } from "./localObject.js"

import { findExportedObject, type RPCObjectExport } from "./export"

describe("Export", () => {
    describe("findExportedObject", () => {
        it("should return the root object", async () => {
            const root: RPCObjectExport = {
                name: "root",
                object: LocalObject.empty,
                children: [],
            }
            expect(findExportedObject(root, [])).toBe(LocalObject.empty)
        })

        it("should traverse any number of levels", async () => {
            const library = new LocalObject("library", [])
            const player = new LocalObject("player", [])
            const appleMusicEngine = new LocalObject("appleMusicEngine", [])
            const webEngine = new LocalObject("webEngine", [])
            const root: RPCObjectExport = {
                name: "root",
                object: LocalObject.empty,
                children: [
                    {
                        name: "library",
                        object: library,
                        children: [
                            {
                                name: "player",
                                object: player,
                                children: [
                                    {
                                        name: "appleMusicEngine",
                                        object: appleMusicEngine,
                                        children: [],
                                    },
                                    {
                                        name: "webEngine",
                                        object: webEngine,
                                        children: [],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            }
            expect(findExportedObject(root, ["library"])).toBe(library)
            expect(findExportedObject(root, ["library", "player"])).toBe(player)
            expect(findExportedObject(root, ["library", "player", "appleMusicEngine"])).toBe(
                appleMusicEngine,
            )
            expect(findExportedObject(root, ["library", "player", "webEngine"])).toBe(webEngine)
        })
    })
})
