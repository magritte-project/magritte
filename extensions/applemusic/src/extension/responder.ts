import type { CommandPresentation, CommandResponder, CommandSelector } from "@magritte/sdk"

export default class AppleMusicCommandResponder implements CommandResponder {
    constructor(private readonly musicKit: MusicKit.Instance) {}

    async presentCommand({ id }: CommandSelector): Promise<CommandPresentation> {
        switch (id) {
            case "account.authorize":
                return {
                    displayName: this.musicKit.isAuthorized ? "Deauthorize" : "Authorize",
                }
            default:
                throw new Error(`Unknown command: ${id}`)
        }
    }

    async executeCommand({ id }: CommandSelector): Promise<void> {
        switch (id) {
            case "account.authorize":
                if (this.musicKit.isAuthorized) {
                    await this.musicKit.unauthorize()
                } else {
                    await this.musicKit.authorize()
                }
                break
            default:
                throw new Error(`Unknown command: ${id}`)
        }
    }
}
