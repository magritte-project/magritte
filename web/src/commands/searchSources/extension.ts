import type { Extension, SearchCommandResponder } from "@magritte/sdk"

import type { CommandInputs } from "@/commands/inputs/base"
import type { SearchSource, SearchSourceResult } from "@/commands/searchSources/base"

export class ExtensionSearchSource implements SearchSource {
    private readonly _searchCommandResponder: SearchCommandResponder

    static async from(extension: Extension): Promise<ExtensionSearchSource> {
        const searchCommandResponder = await extension.searchCommandResponder()
        const id = extension.manifest.id
        const requiredInputKinds: string[] = [] // TODO: add this to manifest
        return new ExtensionSearchSource(searchCommandResponder, id, requiredInputKinds)
    }

    private constructor(
        searchCommandResponder: SearchCommandResponder,
        id: string,
        requiredInputKinds: readonly string[],
    ) {
        this._searchCommandResponder = searchCommandResponder
        this.id = id
        this.requiredInputKinds = requiredInputKinds
    }

    readonly id: string
    readonly requiredInputKinds: readonly string[]

    async search(query: string, inputs: CommandInputs): Promise<SearchSourceResult[]> {
        const results = await this._searchCommandResponder.search({
            query,
            inputs: inputs.allMatching(this.requiredInputKinds),
        })
        return results.map((extensionResult) => {
            let result: SearchSourceResult = {
                id: extensionResult.id,
                icon: extensionResult.icon,
                title: extensionResult.title,
                subtitle: extensionResult.subtitle,
            }
            if (extensionResult.supportedEffects?.includes("add")) {
                result = {
                    ...result,
                    add: async () => {
                        await this._searchCommandResponder.executeEffect({
                            id: extensionResult.id,
                            effect: "add",
                        })
                    },
                }
            }
            if (extensionResult.supportedEffects?.includes("play")) {
                result = {
                    ...result,
                    play: async () => {
                        await this._searchCommandResponder.executeEffect({
                            id: extensionResult.id,
                            effect: "play",
                        })
                    },
                }
            }
            if (extensionResult.supportedEffects?.includes("reveal")) {
                result = {
                    ...result,
                    reveal: async () => {
                        await this._searchCommandResponder.executeEffect({
                            id: extensionResult.id,
                            effect: "reveal",
                        })
                    },
                }
            }
            return result
        })
    }
}
