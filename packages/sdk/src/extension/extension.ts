import { protocol } from "@magritte/rpc"

/**
 * The core protocol which all extensions implement.
 */
export const ExtensionProtocol = protocol("Magritte.Extension", {})
