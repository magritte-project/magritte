import type { ExtensionManifest } from "@magritte/sdk"

import { createEvent, type EventSink, type EventStream } from "@magritte/sdk/utilities"
import { GearIcon } from "@phosphor-icons/react"

import type { ExtensionManager, ExtensionManagerEvent } from "@/extensions/extensionManager"
import type { Split, SplitDefinition, SplitID, SplitParameter } from "@/splits/base"

import { buildExtensionComponent } from "@/components/extensions/ExtensionComponent"
import { QuickMixSplit } from "@/splits/definitions/QuickMixSplit"
import { SongEditorSplit } from "@/splits/definitions/SongEditorSplit"

function getExtensionSplitID(manifest: ExtensionManifest): SplitID {
    return `extension.${manifest.id}`
}

function getExtensionSplitDefinition(manifest: ExtensionManifest): SplitDefinition {
    return {
        id: getExtensionSplitID(manifest),
        name: manifest.name,
        icon: GearIcon,
        minWidth: "16rem",
        preferredLocation: "end",
        allowsMultiple: false,
        requiresParameters: false,
        component: buildExtensionComponent(manifest),
    }
}

export type SplitRegistryEvent =
    | { type: "splitDefinitionAdded"; id: SplitID }
    | { type: "splitDefinitionRemove"; id: SplitID }

export default class SplitRegistry {
    private splitDefinitions: Map<SplitID, SplitDefinition>
    private readonly _events: EventSink<SplitRegistryEvent>

    constructor(extensionManager: ExtensionManager) {
        this.splitDefinitions = new Map()
        ;[this._events, this.$events] = createEvent<SplitRegistryEvent>()

        // TODO: Don't hard code these
        this.registerSplit(QuickMixSplit)
        this.registerSplit(SongEditorSplit)

        for (const installed of extensionManager.installed) {
            this.registerSplit(getExtensionSplitDefinition(installed))
        }
        extensionManager.$events.subscribe((event) => {
            this.handleExtensionEvent(event)
        })
    }

    private handleExtensionEvent(event: ExtensionManagerEvent) {
        switch (event.type) {
            case "extensionInstalled":
                this.registerSplit(getExtensionSplitDefinition(event.manifest))
                break
            case "extensionUninstalled":
                this.unregisterSplit(getExtensionSplitID(event.manifest))
                break
            default:
                break
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
