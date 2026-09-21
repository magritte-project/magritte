import type { CommandInputs } from "@/commands/inputs/base"
import type { SearchSource, SearchSourceResult } from "@/commands/searchSources/base"
import { ExtensionSearchSource } from "@/commands/searchSources/extension"
import type { ExtensionRuntime } from "@/extensions/runtime"
import { createEvent, type EventDispatch, type EventSubscribe } from "@/utilities/events"

export type SearchRegistryEvent = { type: "registeredSourcesChanged" }

export class SearchRegistry {
    private readonly _dispatch: EventDispatch<SearchRegistryEvent>
    private _sources: readonly SearchSource[]

    constructor() {
        ;[this._dispatch, this.subscribe] = createEvent<SearchRegistryEvent>()
        this._sources = []
    }

    readonly subscribe: EventSubscribe<SearchRegistryEvent>

    add(source: SearchSource): () => void {
        this._sources = [...this._sources, source]
        this._dispatch({ type: "registeredSourcesChanged" })
        return () => {
            const toRemove = this._sources.indexOf(source)
            if (toRemove !== -1) {
                const sources = [...this._sources]
                sources.splice(toRemove, 1)
                this._sources = sources
                this._dispatch({ type: "registeredSourcesChanged" })
            }
        }
    }

    wireUpExtensions(extensionRuntime: ExtensionRuntime): void {
        const removes = new Map<string, () => void>()

        Promise.allSettled(
            extensionRuntime.running.map(async (extension) => {
                const searchSource = await ExtensionSearchSource.from(extension)
                const remove = this.add(searchSource)
                removes.set(extension.manifest.id, remove)
            }),
        )
        extensionRuntime.subscribe(async (event) => {
            switch (event.type) {
                case "extensionLoaded": {
                    try {
                        const searchSource = await ExtensionSearchSource.from(event.extension)
                        const remove = this.add(searchSource)
                        removes.set(event.extension.manifest.id, remove)
                        console.debug(
                            "Registered search command for extension",
                            event.extension.manifest.id,
                        )
                    } catch (error) {
                        console.error(
                            "Could not register search command for extension",
                            event.extension.manifest.id,
                            error,
                        )
                    }
                    break
                }
                case "extensionUnloaded": {
                    const remove = removes.get(event.extension.manifest.id)
                    if (remove) {
                        remove()
                        removes.delete(event.extension.manifest.id)
                    }
                    console.debug(
                        "Unregistered search command for extension",
                        event.extension.manifest.id,
                    )
                    break
                }
                default: {
                    break
                }
            }
        })
    }

    async search(
        query: string,
        inputs: CommandInputs,
    ): Promise<ReadonlyMap<string, readonly SearchSourceResult[]>> {
        if (!query) {
            return new Map()
        }
        const pending = this._sources.map(
            (source) => [source.id, source.search(query, inputs)] as const,
        )
        const results = new Map<string, SearchSourceResult[]>()
        for (const [id, promise] of pending) {
            try {
                results.set(id, await promise)
            } catch (error) {
                console.error(`*** Search source ${id} failed`, error)
            }
        }
        return results
    }
}
