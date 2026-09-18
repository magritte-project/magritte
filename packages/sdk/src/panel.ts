import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

/**
 * A protocol which allows an extension to interact with the panel it is presented in.
 */
export const PanelProtocol = protocol("Magritte.Host.Panel", {
    /** Close this extension's panel, leaving any other open extensions in place. */
    close: {
        input: z4.void(),
        output: z4.void(),
    },
})

export type Panel = ProtocolObject<typeof PanelProtocol>
