import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

export const DialogType = z4.enum(["success", "error", "info"])
export type DialogType = z4.infer<typeof DialogType>

export const DialogButtonRole = z4.enum(["primary", "secondary", "destructive"])
export type DialogButtonRole = z4.infer<typeof DialogButtonRole>

export const DialogButton = z4.object({
    id: z4.number(),
    label: z4.string(),
    role: DialogButtonRole,
})
export type DialogButton = z4.infer<typeof DialogButton>

export const enum DialogButtonID {
    ok = 0,
    cancel = 1,
}
export const defaultDialogButtons: DialogButton[] = [
    { id: DialogButtonID.ok, label: "OK", role: "primary" },
]

export const DialogOptions = z4.object({
    type: DialogType,
    title: z4.string(),
    message: z4.string().optional(),
    buttons: z4
        .array(DialogButton)
        .min(1, { error: "Must specify at least one button" })
        .optional(),
})
export type DialogOptions = z4.infer<typeof DialogOptions>

export const ToastOptions = z4.object({
    message: z4.string(),
    type: DialogType,
})
export type ToastOptions = z4.infer<typeof ToastOptions>

export const ChromeProtocol = protocol("Magritte.Host.Chrome", {
    showDialog: {
        input: DialogOptions,
        output: z4.number(),
    },
    showToast: {
        input: ToastOptions,
        output: z4.void(),
    },
})

export type Chrome = ProtocolObject<typeof ChromeProtocol>
