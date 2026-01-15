import type { ServiceInitializerContext } from "@/services/types"

export async function initializeAppleMusic({
    apiClient,
}: ServiceInitializerContext): Promise<void> {
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
}
