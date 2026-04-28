import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod"

export const ServerFunctionsProtocol = protocol("Magritte.Host.ServerFunctions", {
    /** Call a server plugin function by name */
    call: {
        input: z4.object({
            name: z4.string(),
            body: z4.json(),
        }),
        output: z4.json(),
    },
})

export type ServerFunctions = ProtocolObject<typeof ServerFunctionsProtocol>
