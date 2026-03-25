import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

export const ChromeProtocol = protocol("Magritte.Host.Chrome", {
    showToast: {
        input: z4.object({
            message: z4.string(),
            type: z4.union([z4.literal("success"), z4.literal("error"), z4.literal("info")]),
        }),
        output: z4.void(),
    },
})

export type Chrome = ProtocolObject<typeof ChromeProtocol>
