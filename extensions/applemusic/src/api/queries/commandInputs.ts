import {
    allCommandInputsOf,
    getCommandInputKind,
    LibraryInputSchema,
    type ExtensionHost,
} from "@magritte/sdk"
import { queryOptions } from "@tanstack/react-query"

import { commandInputs } from "@/api/keys/commandInputs"

/** Read the IDs of the libraries the host currently has on screen */
export function readOnScreenLibraryIds(extensionHost: ExtensionHost) {
    const kinds = [getCommandInputKind(LibraryInputSchema)]
    return queryOptions({
        queryKey: commandInputs(kinds),
        // Reading on screen context is a permission, so retrying a refusal is pointless
        retry: false,
        queryFn: async () => {
            const commandCoordinator = await extensionHost.commandCoordinator()
            const inputs = await commandCoordinator.allMatching({ kinds })
            return allCommandInputsOf(inputs, LibraryInputSchema).map((input) => input.id)
        },
    })
}
