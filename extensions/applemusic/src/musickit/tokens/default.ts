import type { MusicKitTokenFactory } from "@/musickit/tokens/base"
import { ClientTokenFactory } from "@/musickit/tokens/client"

export function createDefaultClientTokenFactory(): MusicKitTokenFactory {
    return new ClientTokenFactory({
        teamId: import.meta.env.VITE_TEAM_ID,
        appId: import.meta.env.VITE_APP_ID,
        keyId: import.meta.env.VITE_KEY_ID,
        privateKey: import.meta.env.VITE_KEY_SECRET,
    })
}
