import {
    createArtworkArtworksCreatePost,
    createLibraryLibrariesCreatePost,
    createLibraryPermissionLibrariesLibraryIdPermissionCreatePost,
    createSourceSourcesCreatePost,
    deleteArtworkArtworksArtworkIdDelete,
    deleteExtensionExtensionsAvailableExtensionIdDelete,
    deleteLibraryAlbumLibrariesLibraryIdAlbumsAlbumIdDelete,
    deleteLibraryArtistLibrariesLibraryIdArtistsArtistIdDelete,
    deleteLibraryIgnoredResourceLibrariesLibraryIdIgnoredIgnoredResourceIdDelete,
    deleteLibraryPermissionLibrariesLibraryIdPermissionUserIdDelete,
    deleteLibrarySongLibrariesLibraryIdSongsSongIdDelete,
    deleteNotificationUsersNotificationsNotificationIdDelete,
    deleteSourceSourcesSourceIdDelete,
    deleteUserAdminUsersAdminAllUserIdDelete,
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
    readLibraryIgnoredResourcesLibrariesLibraryIdIgnoredGet,
    readLibraryLibrariesLibraryIdGet,
    readLibraryPermissionsLibrariesLibraryIdPermissionsGet,
    readLibrarySongLibrariesLibraryIdSongsSongIdGet,
    readLibrarySongsLibrariesLibraryIdSongsGet,
    readMeUsersMeGet,
    readNotificationsUsersNotificationsGet,
    readNotificationUsersNotificationsNotificationIdGet,
    readSourceChangesSourcesChangesGet,
    readUserAdminUsersAdminAllIdOrUsernameGet,
    readUsersAdminUsersAdminAllGet,
    readUsersUsersAllGet,
    readUserUsersAllIdOrUsernameGet,
    requestSyncLibraryLibrariesLibraryIdSyncPost,
    resetPasswordCompleteResetPasswordCompletePost,
    resetPasswordResetPasswordPost,
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
    updateUserAdminUsersAdminAllUserIdPatch,
    verifyEmailVerifyEmailPost,
    type AlbumRead,
    type AlbumUpdate,
    type ArtistRead,
    type ArtistUpdate,
    type ArtworkCreate,
    type ArtworkRead,
    type ArtworkUpdate,
    type BodySignInSignInPost,
    type BulkIngestSongs,
    type CompleteResetPassword,
    type DeleteLibrarySongLibrariesLibraryIdSongsSongIdDeleteData,
    type ExtensionImportAdmin,
    type IngestPlaybackEvent,
    type InstanceStatusRead,
    type LibraryCreate,
    type LibraryHomePathRead,
    type LibraryMediaReadAlbumRead,
    type LibraryMediaReadArtistRead,
    type LibraryMediaReadExtensionRead,
    type LibraryMediaReadLibraryIgnoredResourceRead,
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
    type ReadAvailableExtensionsExtensionsAvailableGetData,
    type ReadInstalledExtensionsExtensionsInstalledGetData,
    type ReadLibraryAlbumsLibrariesLibraryIdAlbumsGetData,
    type ReadLibraryArtistsLibrariesLibraryIdArtistsGetData,
    type ReadLibraryHomeSubpathsLibrariesHomeSubpathsGetData,
    type ReadLibraryIgnoredResourcesLibrariesLibraryIdIgnoredGetData,
    type ReadLibrarySongsLibrariesLibraryIdSongsGetData,
    type ReadNotificationsUsersNotificationsGetData,
    type ReadSourceChangesSourcesChangesGetData,
    type ReadUsersAdminUsersAdminAllGetData,
    type ReadUsersUsersAllGetData,
    type ResetPassword,
    type SignUp,
    type SongRead,
    type SongUpdate,
    type SourceChangesRead,
    type SourceCreate,
    type SourceRead,
    type SourceUpdate,
    type Token,
    type UserAdminRead,
    type UserAdminsRead,
    type UserAdminUpdate,
    type UserEventPreflight,
    type UserFileAccessPreflight,
    type UserProfileMeRead,
    type UserProfileMeUpdate,
    type UserProfileRead,
    type UserProfilesRead,
} from "./openapi"
import { createClient, type Client } from "./openapi/client"
import type { UserSessionManager } from "./userSession"

export type ReadLibrarySongsSortBy = NonNullable<
    ReadLibrarySongsLibrariesLibraryIdSongsGetData["query"]
>["sort_by"]

export type APIClientEvent = { type: "unauthorized" }

export interface APIClientOptions {
    readonly baseUrl: string
    readonly userSessionManager: UserSessionManager
}

export class APIClient {
    private readonly options: { throwOnError: true; client: Client }
    private readonly subscribers: ((event: APIClientEvent) => void)[]

    constructor({ baseUrl, userSessionManager }: APIClientOptions) {
        const client = createClient({
            baseUrl,
            auth: () => userSessionManager.session?.accessToken,
        })
        const subscribers: ((event: APIClientEvent) => void)[] = []
        client.interceptors.response.use(async (response) => {
            if (!response.ok) {
                if (response.status === 401) {
                    userSessionManager.replaceSession(null)
                    for (const subscriber of this.subscribers.slice()) {
                        try {
                            subscriber({ type: "unauthorized" })
                        } catch (error) {
                            console.error(
                                `*** Unhandled error in API client event subscriber`,
                                error,
                            )
                        }
                    }
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
                    console.warn(
                        `Could not include detail for error response, reason: ${String(e)}`,
                    )
                }

                throw new Error(message)
            }
            return response
        })
        this.options = { throwOnError: true, client }
        this.subscribers = subscribers
    }

    // -- API Client Events -- //

    subscribe(subscriber: (event: APIClientEvent) => void): () => void {
        this.subscribers.push(subscriber)
        return () => {
            const toRemove = this.subscribers.indexOf(subscriber)
            if (toRemove !== -1) {
                this.subscribers.splice(toRemove, 1)
            }
        }
    }

    // -- Instance Status -- //

    /** Access the instance status of the API, fetching it if it's not already loaded */
    async instanceStatus(): Promise<InstanceStatusRead> {
        return await readInstanceStatusStatusGet(this.options)
    }

    // -- Root Routes -- //

    async signUp(body: SignUp): Promise<UserProfileMeRead> {
        return await signUpSignUpPost({ ...this.options, body })
    }

    async signIn(body: BodySignInSignInPost): Promise<Token> {
        return await signInSignInPost({ ...this.options, body })
    }

    async verifyEmail(token: string): Promise<OperationResult> {
        return await verifyEmailVerifyEmailPost({ ...this.options, query: { token } })
    }

    async resetPassword(body: ResetPassword): Promise<OperationResult> {
        return await resetPasswordResetPasswordPost({ ...this.options, body })
    }

    async resetPasswordComplete(body: CompleteResetPassword): Promise<OperationResult> {
        return await resetPasswordCompleteResetPasswordCompletePost({ ...this.options, body })
    }

    // -- User Routes -- //

    async readMe(): Promise<UserProfileMeRead> {
        return await readMeUsersMeGet(this.options)
    }

    async updateMe(body: UserProfileMeUpdate): Promise<UserProfileMeRead> {
        return await updateMeUsersMePost({ ...this.options, body })
    }

    async readNotifications(
        query?: ReadNotificationsUsersNotificationsGetData["query"],
    ): Promise<NotificationsRead> {
        return await readNotificationsUsersNotificationsGet({ ...this.options, query })
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

    async readAllUsers(query?: ReadUsersUsersAllGetData["query"]): Promise<UserProfilesRead> {
        return await readUsersUsersAllGet({ ...this.options, query })
    }

    async readUserAdmin(id_or_username: number | string): Promise<UserAdminRead> {
        return await readUserAdminUsersAdminAllIdOrUsernameGet({
            ...this.options,
            path: { id_or_username: String(id_or_username) },
        })
    }

    async readAllUsersAdmin(
        query?: ReadUsersAdminUsersAdminAllGetData["query"],
    ): Promise<UserAdminsRead> {
        return await readUsersAdminUsersAdminAllGet({ ...this.options, query })
    }

    async updateUserAdmin(user_id: number, body: UserAdminUpdate): Promise<UserAdminRead> {
        return await updateUserAdminUsersAdminAllUserIdPatch({
            ...this.options,
            path: { user_id },
            body,
        })
    }

    async deleteUserAdmin(user_id: number): Promise<OperationResult> {
        return await deleteUserAdminUsersAdminAllUserIdDelete({
            ...this.options,
            path: { user_id },
        })
    }

    async readFilesPreflight(): Promise<UserFileAccessPreflight> {
        return await readFilesPreflightUsersFilesPreflightPost(this.options)
    }

    // -- Library Routes -- //

    async readLibraries(): Promise<readonly LibraryRead[]> {
        return await readLibrariesLibrariesGet(this.options)
    }

    async readLibraryHomeSubpaths(
        query: ReadLibraryHomeSubpathsLibrariesHomeSubpathsGetData["query"],
    ): Promise<LibraryHomePathRead> {
        return await readLibraryHomeSubpathsLibrariesHomeSubpathsGet({ ...this.options, query })
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

    async readLibraryIgnoredResources(
        library_id: number,
        query?: ReadLibraryIgnoredResourcesLibrariesLibraryIdIgnoredGetData["query"],
    ): Promise<LibraryMediaReadLibraryIgnoredResourceRead> {
        return await readLibraryIgnoredResourcesLibrariesLibraryIdIgnoredGet({
            ...this.options,
            path: { library_id },
            query,
        })
    }

    async deleteLibraryIgnoredResource(
        library_id: number,
        ignored_resource_id: number,
    ): Promise<OperationResult> {
        return await deleteLibraryIgnoredResourceLibrariesLibraryIdIgnoredIgnoredResourceIdDelete({
            ...this.options,
            path: { library_id, ignored_resource_id },
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
        query?: ReadLibraryAlbumsLibrariesLibraryIdAlbumsGetData["query"],
    ): Promise<LibraryMediaReadAlbumRead> {
        return await readLibraryAlbumsLibrariesLibraryIdAlbumsGet({
            ...this.options,
            path: { library_id },
            query,
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
        query?: ReadLibraryArtistsLibrariesLibraryIdArtistsGetData["query"],
    ): Promise<LibraryMediaReadArtistRead> {
        return await readLibraryArtistsLibrariesLibraryIdArtistsGet({
            ...this.options,
            path: { library_id },
            query,
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

    async deleteLibrarySong(
        library_id: number,
        song_id: number,
        query?: DeleteLibrarySongLibrariesLibraryIdSongsSongIdDeleteData["query"],
    ): Promise<void> {
        await deleteLibrarySongLibrariesLibraryIdSongsSongIdDelete({
            ...this.options,
            path: { library_id, song_id },
            query,
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
        query?: ReadLibrarySongsLibrariesLibraryIdSongsGetData["query"],
    ): Promise<LibraryMediaReadSongRead> {
        return await readLibrarySongsLibrariesLibraryIdSongsGet({
            ...this.options,
            path: { library_id },
            query,
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

    async readSourceChanges(
        query: ReadSourceChangesSourcesChangesGetData["query"],
    ): Promise<SourceChangesRead> {
        return await readSourceChangesSourcesChangesGet({ ...this.options, query })
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
        query?: ReadAvailableExtensionsExtensionsAvailableGetData["query"],
    ): Promise<LibraryMediaReadExtensionRead> {
        return await readAvailableExtensionsExtensionsAvailableGet({ ...this.options, query })
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
        query?: ReadInstalledExtensionsExtensionsInstalledGetData["query"],
    ): Promise<LibraryMediaReadExtensionRead> {
        return await readInstalledExtensionsExtensionsInstalledGet({ ...this.options, query })
    }
}
