import { describe, expect, it } from "vitest"

import { appendPathComponent, lastPathComponent, removeLastPathComponent } from "./paths"

describe("paths", () => {
    describe("#removeLastPathComponent", () => {
        it("should correctly handle root paths", () => {
            expect(removeLastPathComponent("")).toStrictEqual("")
            expect(removeLastPathComponent("/")).toStrictEqual("/")
            expect(removeLastPathComponent(".")).toStrictEqual(".")
            expect(removeLastPathComponent("./")).toStrictEqual(".")
            expect(removeLastPathComponent("..")).toStrictEqual("..")
            expect(removeLastPathComponent("../")).toStrictEqual("..")
        })

        it("should correctly handle standalone names paths", () => {
            expect(removeLastPathComponent("here")).toStrictEqual("here")
            expect(removeLastPathComponent("image.jpg")).toStrictEqual("image.jpg")
        })

        it("should correctly remove last path component", () => {
            expect(removeLastPathComponent("/absolutely")).toStrictEqual("/")
            expect(removeLastPathComponent("/absolute/path/to")).toStrictEqual("/absolute/path")
            expect(removeLastPathComponent("./relatively")).toStrictEqual(".")
            expect(removeLastPathComponent("./relative/path/to")).toStrictEqual("./relative/path")
        })
    })

    describe("#appendPathComponent", () => {
        it("should append filename to path", () => {
            expect(appendPathComponent("/covers", "image.png")).toStrictEqual("/covers/image.png")
        })

        it("should combine paths", () => {
            expect(appendPathComponent("/covers", "/pngs")).toStrictEqual("/covers/pngs")
            expect(appendPathComponent("/covers/", "jpgs")).toStrictEqual("/covers/jpgs")
            expect(appendPathComponent("/covers/", "/gifs")).toStrictEqual("/covers/gifs")
        })
    })

    describe("#lastPathComponent", () => {
        it("should correctly handle root paths", () => {
            expect(lastPathComponent("/")).toStrictEqual("/")
            expect(lastPathComponent("./")).toStrictEqual(".")
            expect(lastPathComponent("../")).toStrictEqual("..")
        })

        it("should correctly file paths slashes", () => {
            expect(lastPathComponent("/home/image.jpg")).toStrictEqual("image.jpg")
        })

        it("should correctly directory paths", () => {
            expect(lastPathComponent("/home/")).toStrictEqual("home")
        })
    })
})
