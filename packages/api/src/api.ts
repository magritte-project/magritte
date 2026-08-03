import { APIClient } from "./client"
import { FileAccess } from "./fileAccess"
import { UserEventsManager } from "./userEvents"
import { StorageUserSessionManager, type UserSessionManager } from "./userSession"

export interface APIOptions {
    readonly baseUrl: string
    readonly userSessionManager?: UserSessionManager
}

export interface API {
    readonly client: APIClient
    readonly fileAccess: FileAccess
    readonly userEventsManager: UserEventsManager
    readonly userSessionManager: UserSessionManager
}

export function createAPI({
    baseUrl,
    userSessionManager = StorageUserSessionManager.local,
}: APIOptions): API {
    const client = new APIClient({ baseUrl, userSessionManager })
    const fileAccess = new FileAccess(client)
    const userEventsManager = new UserEventsManager(baseUrl, client, userSessionManager)
    return { client, fileAccess, userEventsManager, userSessionManager }
}
