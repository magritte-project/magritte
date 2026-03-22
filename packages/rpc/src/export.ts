import type { RPCObject } from "@/object"

export interface RPCObjectExport {
    /**
     * The name of the export, typically based on
     * a principle protocol the object conforms to.
     */
    readonly name: string

    /**
     * The exported object.
     */
    readonly object: RPCObject

    /**
     * The children of this export.
     */
    readonly children: readonly RPCObjectExport[]
}

/**
 * Traverses the export tree and returns the object at the given path.
 *
 * @param start The root export to start traversal from.
 * @param path The path to the object.
 * @returns The object at the given path, or `null` if not found.
 */
export function findExportedObject(
    start: RPCObjectExport,
    path: readonly string[],
): RPCObject | null {
    const walkingPath = [...path]
    let current: RPCObjectExport | undefined = start
    while (walkingPath.length > 0 && current !== null) {
        const nextName = walkingPath.shift()
        if (!nextName) {
            break
        }
        current = current?.children.find((child) => child.name === nextName)
    }
    return current?.object ?? null
}
