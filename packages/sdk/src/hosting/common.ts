import { defineBroadcast } from "@magritte/rpc"
import z4 from "zod/v4"

/** The channel which an extension broadcasts to its host on */
const ExtensionToHostChannel = "extensionToHost"

/** Broadcast sent by an extension to the host to request the extension be opened */
export const ExtensionRequestOpen = defineBroadcast(
    ExtensionToHostChannel,
    "requestOpen",
    z4.object({ urgent: z4.boolean().readonly() }),
)

/** Broadcast sent by an extension to the host to request the extension be closed */
export const ExtensionRequestClose = defineBroadcast(
    ExtensionToHostChannel,
    "requestClose",
    z4.void(),
)
