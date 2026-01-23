import type { Version } from "@/base/version"

export interface RPCProtocol {
    readonly name: string
    readonly version: Version
}
