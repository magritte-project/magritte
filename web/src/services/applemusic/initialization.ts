import type { ServiceInitializerContext } from "@/services/types"

import { AppleMusicService } from "./service"

export async function initializeAppleMusic({
    apiClient,
    instanceStatus,
}: ServiceInitializerContext): Promise<AppleMusicService> {
    if (!instanceStatus.available_functions.includes("apple_music_token")) {
        throw new Error("Apple Music is not available")
    }
    await new Promise<void>((resolve) => {
        if ("MusicKit" in window) {
            resolve()
        } else {
            document.addEventListener("musickitloaded", () => {
                resolve()
            })
        }
    })
    const tokenResult = (await apiClient.callFunction("apple_music_token")) as {
        developer_token: string
    }
    await MusicKit.configure({
        developerToken: tokenResult.developer_token,
        app: {
            name: "Magritte",
        },
    })
    console.info("MusicKit ready")
    return new AppleMusicService()
}
