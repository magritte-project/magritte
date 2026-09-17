import {
    createArtworkArtworksCreatePost,
    createLibraryLibrariesCreatePost,
    createLibraryPermissionLibrariesLibraryIdPermissionCreatePost,
    createSourceSourcesCreatePost,
    deleteArtworkArtworksArtworkIdDelete,
    deleteExtensionExtensionsAvailableExtensionIdDelete,
    deleteLibraryAlbumLibrariesLibraryIdAlbumsAlbumIdDelete,
    deleteLibraryArtistLibrariesLibraryIdArtistsArtistIdDelete,
    deleteLibraryPermissionLibrariesLibraryIdPermissionUserIdDelete,
    deleteLibrarySongLibrariesLibraryIdSongsSongIdDelete,
    deleteNotificationUsersNotificationsNotificationIdDelete,
    deleteSourceSourcesSourceIdDelete,
    importExtensionExtensionsAvailableImportPost,
    ingestFilesLibrariesLibraryIdIngestFilesPost,
    ingestPlaybackEventsPlaybackEventsIngestPost,
    ingestSongsLibrariesLibraryIdIngestSongsPost,
    installExtensionExtensionsAvailableExtensionIdInstallPost,
    markAllNotificationsReadUsersNotificationsMarkAllReadPost,
    readAllSourcesSourcesAllGet,
    readAvailableExtensionsExtensionsAvailableGet,
    readFilesPreflightUsersFilesPreflightPost,
    readInstalledExtensionsExtensionsInstalledGet,
    readInstanceStatusStatusGet,
    readLibrariesLibrariesGet,
    readLibraryAlbumLibrariesLibraryIdAlbumsAlbumIdGet,
    readLibraryAlbumsLibrariesLibraryIdAlbumsGet,
    readLibraryArtistLibrariesLibraryIdArtistsArtistIdGet,
    readLibraryArtistsLibrariesLibraryIdArtistsGet,
    readLibraryHomeSubpathsLibrariesHomeSubpathsGet,
    readLibraryLibrariesLibraryIdGet,
    readLibraryPermissionsLibrariesLibraryIdPermissionsGet,
    readLibrarySongLibrariesLibraryIdSongsSongIdGet,
    readLibrarySongsLibrariesLibraryIdSongsGet,
    readMeUsersMeGet,
    readNotificationsUsersNotificationsGet,
    readNotificationUsersNotificationsNotificationIdGet,
    readUsersUsersAllGet,
    readUserUsersAllIdOrUsernameGet,
    requestSyncLibraryLibrariesLibraryIdSyncPost,
    signInSignInPost,
    signUpSignUpPost,
    streamUserEventsPreflightUsersEventsPreflightPost,
    uninstallExtensionExtensionsInstalledExtensionIdDelete,
    updateArtworkArtworksArtworkIdPatch,
    updateLibraryAlbumLibrariesLibraryIdAlbumsAlbumIdPatch,
    updateLibraryArtistLibrariesLibraryIdArtistsArtistIdPatch,
    updateLibraryLibrariesLibraryIdPatch,
    updateLibraryPermissionLibrariesLibraryIdPermissionUserIdPatch,
    updateLibrarySongLibrariesLibraryIdSongsSongIdPatch,
    updateMeUsersMePost,
    updateNotificationUsersNotificationsNotificationIdPatch,
    updateSourceSourcesSourceIdPatch,
    type AlbumRead,
    type AlbumUpdate,
    type ArtistRead,
    type ArtistUpdate,
    type ArtworkCreate,
    type ArtworkRead,
    type ArtworkUpdate,
    type BodySignInSignInPost,
    type BulkIngestSongs,
    type ExtensionImportAdmin,
    type IngestPlaybackEvent,
    type InstanceStatusRead,
    type LibraryCreate,
    type LibraryHomePathRead,
    type LibraryMediaReadAlbumRead,
    type LibraryMediaReadArtistRead,
    type LibraryMediaReadExtensionRead,
    type LibraryMediaReadSongRead,
    type LibraryMediaReadSourceRead,
    type LibraryPermissionCreate,
    type LibraryPermissionRead,
    type LibraryPermissionUpdate,
    type LibraryRead,
    type LibraryUpdate,
    type NotificationRead,
    type NotificationsRead,
    type NotificationUpdate,
    type OperationResult,
    type PlaybackEventIngestResult,
    type ReadAllSourcesSourcesAllGetData,
    type ReadLibrarySongsLibrariesLibraryIdSongsGetData,
    type SongRead,
    type SongUpdate,
    type SourceCreate,
    type SourceRead,
    type SourceUpdate,
    type UserEventPreflight,
    type UserFileAccessPreflight,
    type UserProfileRead,
    type UserProfilesRead,
    type UserProfileUpdate,
    type UserSignUp,
} from "./openapi"
import { createClient, type Client } from "./openapi/client"
import type { UserSessionManager } from "./userSession"

export type ReadLibrarySongsSortBy = NonNullable<
    ReadLibrarySongsLibrariesLibraryIdSongsGetData["query"]
>["sort_by"]

export class APIClientUnauthorizedEvent extends Event {
    constructor(eventInit?: EventInit) {
        super("unauthorized", eventInit)
    }
}

interface APIClientEvents {
    unauthorized: APIClientUnauthorizedEvent
}

export interface APIClientOptions {
    readonly baseUrl: string
    readonly userSessionManager: UserSessionManager
}

export class APIClient {
    private readonly options: { throwOnError: true; client: Client }
    private readonly events: EventTarget

    constructor({ baseUrl, userSessionManager }: APIClientOptions) {
        const client = createClient({
            baseUrl,
            auth: () => userSessionManager.current?.accessToken,
        })
        const events = new EventTarget()
        client.interceptors.response.use(async (response) => {
            if (!response.ok) {
                if (response.status === 401) {
                    userSessionManager.current = null
                    events.dispatchEvent(new APIClientUnauthorizedEvent())
                }

                let message = `${response.status}: ${response.statusText}`

                try {
                    const errorResponse = await response.json()
                    const detail = errorResponse.detail
                    message += ": "
                    if (Array.isArray(detail)) {
                        message += detail
                            .filter(
                                (detail) =>
                                    typeof detail === "object" &&
                                    detail !== null &&
                                    "msg" in detail,
                            )
                            .map((detail) => String(detail.msg))
                            .join("\n")
                    } else {
                        message += String(detail)
                    }
                } catch (e) {
                    console.warn(`Could not include detail for error response, reason: ${e}`)
                }

                throw new Error(message)
            }
            return response
        })
        this.options = { throwOnError: true, client }
        this.events = events
    }

    // -- Event Handling -- //

    addEventListener<K extends keyof APIClientEvents>(
        event: K,
        listener: (event: APIClientEvents[K]) => void,
    ): void {
        this.events.addEventListener(event, listener)
    }

    removeEventListener<K extends keyof APIClientEvents>(
        event: K,
        listener: (event: APIClientEvents[K]) => void,
    ): void {
        this.events.removeEventListener(event, listener)
    }

    // -- Instance Status -- //

    /** Access the instance status of the API, fetching it if it's not already loaded */
    async instanceStatus(): Promise<InstanceStatusRead> {
        return await readInstanceStatusStatusGet(this.options)
    }

    // -- Root Routes -- //

    async signUp(body: UserSignUp): Promise<UserProfileRead> {
        return await signUpSignUpPost({ ...this.options, body })
    }

    async signIn(body: BodySignInSignInPost) {
        return await signInSignInPost({ ...this.options, body })
    }

    // -- User Routes -- //

    async readMe(): Promise<UserProfileRead> {
        return await readMeUsersMeGet(this.options)
    }

    async updateMe(body: UserProfileUpdate): Promise<UserProfileRead> {
        return await updateMeUsersMePost({ ...this.options, body })
    }

    async readNotifications(offset?: number, limit?: number): Promise<NotificationsRead> {
        return await readNotificationsUsersNotificationsGet({
            ...this.options,
            query: { offset, limit },
        })
    }

    async readNotification(notification_id: number): Promise<NotificationRead> {
        return await readNotificationUsersNotificationsNotificationIdGet({
            ...this.options,
            path: { notification_id },
        })
    }

    async updateNotification(
        notification_id: number,
        body: NotificationUpdate,
    ): Promise<NotificationRead> {
        return await updateNotificationUsersNotificationsNotificationIdPatch({
            ...this.options,
            path: { notification_id },
            body,
        })
    }

    async deleteNotification(notification_id: number): Promise<OperationResult> {
        return await deleteNotificationUsersNotificationsNotificationIdDelete({
            ...this.options,
            path: { notification_id },
        })
    }

    async markAllNotificationsRead(): Promise<OperationResult> {
        return await markAllNotificationsReadUsersNotificationsMarkAllReadPost(this.options)
    }

    async streamUserEventsPreflight(): Promise<UserEventPreflight> {
        return await streamUserEventsPreflightUsersEventsPreflightPost(this.options)
    }

    async readUser(id_or_username: number | string): Promise<UserProfileRead> {
        return await readUserUsersAllIdOrUsernameGet({
            ...this.options,
            path: { id_or_username: String(id_or_username) },
        })
    }

    async readAllUsers(query?: string, offset?: number, limit?: number): Promise<UserProfilesRead> {
        return await readUsersUsersAllGet({ ...this.options, query: { query, offset, limit } })
    }

    async readFilesPreflight(): Promise<UserFileAccessPreflight> {
        return await readFilesPreflightUsersFilesPreflightPost(this.options)
    }

    // -- Library Routes -- //

    async readLibraries(): Promise<readonly LibraryRead[]> {
        return await readLibrariesLibrariesGet(this.options)
    }

    async readLibraryHomeSubpaths(relative_to: string): Promise<LibraryHomePathRead> {
        return await readLibraryHomeSubpathsLibrariesHomeSubpathsGet({
            ...this.options,
            query: { relative_to },
        })
    }

    async createLibrary(body: LibraryCreate): Promise<LibraryRead> {
        return await createLibraryLibrariesCreatePost({ ...this.options, body })
    }

    async updateLibrary(library_id: number, body: LibraryUpdate): Promise<LibraryRead> {
        return await updateLibraryLibrariesLibraryIdPatch({
            ...this.options,
            path: { library_id },
            body,
        })
    }

    async readLibrary(library_id: number): Promise<LibraryRead> {
        return await readLibraryLibrariesLibraryIdGet({ ...this.options, path: { library_id } })
    }

    async readLibraryPermissions(library_id: number): Promise<readonly LibraryPermissionRead[]> {
        return await readLibraryPermissionsLibrariesLibraryIdPermissionsGet({
            ...this.options,
            path: { library_id },
        })
    }

    async createLibraryPermission(
        library_id: number,
        body: LibraryPermissionCreate,
    ): Promise<LibraryPermissionRead> {
        return await createLibraryPermissionLibrariesLibraryIdPermissionCreatePost({
            ...this.options,
            path: { library_id },
            body,
        })
    }

    async updateLibraryPermission(
        library_id: number,
        user_id: number,
        body: LibraryPermissionUpdate,
    ): Promise<LibraryPermissionRead> {
        return await updateLibraryPermissionLibrariesLibraryIdPermissionUserIdPatch({
            ...this.options,
            path: { library_id, user_id },
            body,
        })
    }

    async deleteLibraryPermission(library_id: number, user_id: number): Promise<OperationResult> {
        return await deleteLibraryPermissionLibrariesLibraryIdPermissionUserIdDelete({
            ...this.options,
            path: { library_id, user_id },
        })
    }

    async updateLibraryAlbum(
        library_id: number,
        album_id: number,
        body: AlbumUpdate,
    ): Promise<AlbumRead> {
        return await updateLibraryAlbumLibrariesLibraryIdAlbumsAlbumIdPatch({
            ...this.options,
            path: { library_id, album_id },
            body,
        })
    }

    async deleteLibraryAlbum(library_id: number, album_id: number): Promise<void> {
        await deleteLibraryAlbumLibrariesLibraryIdAlbumsAlbumIdDelete({
            ...this.options,
            path: { library_id, album_id },
        })
    }

    async readLibraryAlbum(library_id: number, album_id: number): Promise<AlbumRead> {
        return await readLibraryAlbumLibrariesLibraryIdAlbumsAlbumIdGet({
            ...this.options,
            path: { library_id, album_id },
        })
    }

    async readLibraryAlbums(
        library_id: number,
        query?: string,
        artist_id?: number,
        offset?: number,
        limit?: number,
    ): Promise<LibraryMediaReadAlbumRead> {
        return await readLibraryAlbumsLibrariesLibraryIdAlbumsGet({
            ...this.options,
            path: { library_id },
            query: { query, artist_id, offset, limit },
        })
    }

    async updateLibraryArtist(
        library_id: number,
        artist_id: number,
        body: ArtistUpdate,
    ): Promise<ArtistRead> {
        return await updateLibraryArtistLibrariesLibraryIdArtistsArtistIdPatch({
            ...this.options,
            path: { library_id, artist_id },
            body,
        })
    }

    async deleteLibraryArtist(library_id: number, artist_id: number): Promise<void> {
        await deleteLibraryArtistLibrariesLibraryIdArtistsArtistIdDelete({
            ...this.options,
            path: { library_id, artist_id },
        })
    }

    async readLibraryArtist(library_id: number, artist_id: number): Promise<ArtistRead> {
        return await readLibraryArtistLibrariesLibraryIdArtistsArtistIdGet({
            ...this.options,
            path: { library_id, artist_id },
        })
    }

    async readLibraryArtists(
        library_id: number,
        query?: string,
        offset?: number,
        limit?: number,
    ): Promise<LibraryMediaReadArtistRead> {
        return await readLibraryArtistsLibrariesLibraryIdArtistsGet({
            ...this.options,
            path: { library_id },
            query: { query, offset, limit },
        })
    }

    async updateLibrarySong(
        library_id: number,
        song_id: number,
        body: SongUpdate,
    ): Promise<SongRead> {
        return await updateLibrarySongLibrariesLibraryIdSongsSongIdPatch({
            ...this.options,
            path: { library_id, song_id },
            body,
        })
    }

    async deleteLibrarySong(library_id: number, song_id: number): Promise<void> {
        await deleteLibrarySongLibrariesLibraryIdSongsSongIdDelete({
            ...this.options,
            path: { library_id, song_id },
        })
    }

    async readLibrarySong(library_id: number, song_id: number): Promise<SongRead> {
        return await readLibrarySongLibrariesLibraryIdSongsSongIdGet({
            ...this.options,
            path: { library_id, song_id },
        })
    }

    async readLibrarySongs(
        library_id: number,
        query?: string,
        album_id?: number,
        artist_id?: number,
        sort_by?: ReadLibrarySongsSortBy,
        offset?: number,
        limit?: number,
    ): Promise<LibraryMediaReadSongRead> {
        return await readLibrarySongsLibrariesLibraryIdSongsGet({
            ...this.options,
            path: { library_id },
            query: { query, album_id, artist_id, sort_by, offset, limit },
        })
    }

    // -- Artwork Routes -- //

    async createArtwork(body: ArtworkCreate): Promise<ArtworkRead> {
        return await createArtworkArtworksCreatePost({ ...this.options, body })
    }

    async updateArtwork(artwork_id: number, body: ArtworkUpdate): Promise<ArtworkRead> {
        return await updateArtworkArtworksArtworkIdPatch({
            ...this.options,
            path: { artwork_id },
            body,
        })
    }

    async deleteArtwork(artwork_id: number): Promise<void> {
        await deleteArtworkArtworksArtworkIdDelete({ ...this.options, path: { artwork_id } })
    }

    // -- Source Routes -- //

    async readAllSources(
        query?: ReadAllSourcesSourcesAllGetData["query"],
    ): Promise<LibraryMediaReadSourceRead> {
        return await readAllSourcesSourcesAllGet({ ...this.options, query })
    }

    async createSource(body: SourceCreate): Promise<SourceRead> {
        return await createSourceSourcesCreatePost({ ...this.options, body })
    }

    async updateSource(source_id: number, body: SourceUpdate): Promise<SourceRead> {
        return await updateSourceSourcesSourceIdPatch({
            ...this.options,
            path: { source_id },
            body,
        })
    }

    async deleteSource(source_id: number): Promise<void> {
        await deleteSourceSourcesSourceIdDelete({ ...this.options, path: { source_id } })
    }

    // -- Playback Event Routes -- //

    async ingestPlaybackEvents(body: IngestPlaybackEvent[]): Promise<PlaybackEventIngestResult> {
        return await ingestPlaybackEventsPlaybackEventsIngestPost({
            ...this.options,
            body,
        })
    }

    // -- Ingestion Routes -- //

    async ingestFiles(library_id: number, files: Array<Blob | File>): Promise<OperationResult> {
        return await ingestFilesLibrariesLibraryIdIngestFilesPost({
            ...this.options,
            path: { library_id },
            body: { files },
        })
    }

    async ingestSongs(library_id: number, body: BulkIngestSongs): Promise<readonly SongRead[]> {
        return await ingestSongsLibrariesLibraryIdIngestSongsPost({
            ...this.options,
            path: { library_id },
            body,
        })
    }

    async requestSyncLibrary(library_id: number): Promise<OperationResult> {
        return await requestSyncLibraryLibrariesLibraryIdSyncPost({
            ...this.options,
            path: { library_id },
        })
    }

    // -- Extension Routes -- //

    async importExtension(body: ExtensionImportAdmin): Promise<OperationResult> {
        return await importExtensionExtensionsAvailableImportPost({ ...this.options, body })
    }

    async deleteExtension(extension_id: number): Promise<OperationResult> {
        return await deleteExtensionExtensionsAvailableExtensionIdDelete({
            ...this.options,
            path: { extension_id },
        })
    }

    async readAvailableExtensions(
        offset?: number,
        limit?: number,
    ): Promise<LibraryMediaReadExtensionRead> {
        return await readAvailableExtensionsExtensionsAvailableGet({
            ...this.options,
            query: { offset, limit },
        })
    }

    async installExtension(extension_id: number): Promise<OperationResult> {
        return await installExtensionExtensionsAvailableExtensionIdInstallPost({
            ...this.options,
            path: { extension_id },
        })
    }

    async uninstallExtension(extension_id: number): Promise<OperationResult> {
        return await uninstallExtensionExtensionsInstalledExtensionIdDelete({
            ...this.options,
            path: { extension_id },
        })
    }

    async readInstalledExtensions(
        offset?: number,
        limit?: number,
    ): Promise<LibraryMediaReadExtensionRead> {
        return await readInstalledExtensionsExtensionsInstalledGet({
            ...this.options,
            query: { offset, limit },
        })
    }
}
