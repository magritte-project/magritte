import {
    createEvent,
    type EventSink,
    type EventStream,
    type ExtensionManifest,
} from "@magritte/sdk"
import { GearIcon } from "@phosphor-icons/react"

import { buildExtensionComponent } from "@/components/extensions/ExtensionComponent"
import type { ExtensionRuntime, ExtensionRuntimeEvent } from "@/extensions/runtime"
import type { Split, SplitDefinition, SplitID, SplitParameter } from "@/splits/base"
import { QuickMixSplit } from "@/splits/definitions/QuickMixSplit"
import { SongEditorSplit } from "@/splits/definitions/SongEditorSplit"

function getExtensionSplitID(manifest: ExtensionManifest): SplitID {
    return `extension.${manifest.id}`
}

function getExtensionSplitDefinition(manifest: ExtensionManifest): SplitDefinition | undefined {
    const splitUseCase = manifest.useCases?.find((useCase) => useCase.type === "split")
    if (splitUseCase === undefined) {
        return undefined
    }
    return {
        id: getExtensionSplitID(manifest),
        name: manifest.name,
        icon: GearIcon,
        minWidth: splitUseCase.minWidth,
        preferredLocation: splitUseCase.preferredLocation,
        allowsMultiple: false,
        requiresParameters: false,
        component: buildExtensionComponent(manifest.id),
    }
}

export type SplitRegistryEvent =
    | { type: "splitDefinitionAdded"; id: SplitID }
    | { type: "splitDefinitionRemove"; id: SplitID }

export default class SplitRegistry {
    private readonly splitDefinitions: Map<SplitID, SplitDefinition>
    private readonly _events: EventSink<SplitRegistryEvent>

    constructor(extensionRuntime: ExtensionRuntime) {
        this.splitDefinitions = new Map()
        ;[this._events, this.$events] = createEvent<SplitRegistryEvent>()

        // TODO: Don't hard code these
        this.registerSplit(QuickMixSplit)
        this.registerSplit(SongEditorSplit)

        for (const installed of extensionRuntime.available) {
            const split = getExtensionSplitDefinition(installed)
            if (split !== undefined) {
                this.registerSplit(split)
            }
        }
        extensionRuntime.$events.subscribe((event) => {
            this.handleExtensionEvent(event)
        })
    }

    private handleExtensionEvent(event: ExtensionRuntimeEvent) {
        switch (event.type) {
            case "extensionAdded": {
                const split = getExtensionSplitDefinition(event.manifest)
                if (split !== undefined) {
                    this.registerSplit(split)
                }
                break
            }
            case "extensionRemoved": {
                this.unregisterSplit(getExtensionSplitID(event.manifest))
                break
            }
            default: {
                break
            }
        }
    }

    readonly $events: EventStream<SplitRegistryEvent>;

    *allOpenable(): IterableIterator<SplitDefinition> {
        for (const definition of this.splitDefinitions.values()) {
            if (!definition.requiresParameters) {
                yield definition
            }
        }
    }

    get(id: SplitID): SplitDefinition | undefined {
        return this.splitDefinitions.get(id)
    }

    *getAll(
        splits: Iterable<Split>,
    ): IterableIterator<[SplitDefinition, readonly SplitParameter[], number]> {
        let index = 0
        for (const { id, parameters } of splits) {
            const split = this.get(id)
            if (split) {
                yield [split, parameters, index++]
            }
        }
    }

    registerSplit(splitDefinition: SplitDefinition) {
        const id = splitDefinition.id
        if (this.splitDefinitions.has(id)) {
            throw new Error(`Split definition with id ${id} already exists`)
        }
        this.splitDefinitions.set(id, splitDefinition)
        this._events.dispatch({ type: "splitDefinitionAdded", id: id })
    }

    unregisterSplit(id: SplitID) {
        const deleted = this.splitDefinitions.delete(id)
        if (deleted) {
            this._events.dispatch({ type: "splitDefinitionRemove", id })
        }
        return deleted
    }
}
