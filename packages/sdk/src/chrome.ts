import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

export const ToastType = z4.union([z4.literal("success"), z4.literal("error"), z4.literal("info")])
export type ToastType = z4.infer<typeof ToastType>

export const ToastOptions = z4.object({
    message: z4.string(),
    type: ToastType,
})
export type ToastOptions = z4.infer<typeof ToastOptions>

export const ChromeProtocol = protocol("Magritte.Host.Chrome", {
    showToast: {
        input: ToastOptions,
        output: z4.void(),
    },
})

export type Chrome = ProtocolObject<typeof ChromeProtocol>
