import waitForMusicKit from "@/services/applemusic/initialization"
import type { ServiceClientContext } from "@/services/client"

export async function initializeAppleMusic({
    apiClient,
}: ServiceClientContext): Promise<void> {
    await waitForMusicKit()
    const tokenResult = await apiClient.readServiceToken("applemusic")
    await MusicKit.configure({
        developerToken: tokenResult.bearer_token,
        app: {
            name: "Magritte",
        },
    })
    console.info("MusicKit ready")
}
