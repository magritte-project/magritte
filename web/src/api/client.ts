import createClient, { type Client, type FetchResponse, type Middleware } from "openapi-fetch"

import type {
    AlbumRead,
    AlbumUpdate,
    ArtistRead,
    ArtistUpdate,
    ArtworkCreate,
    ArtworkRead,
    ArtworkUpdate,
    BodySignInSignInPost,
    BulkIngestSongs,
    LibraryCreate,
    LibraryHomePathRead,
    LibraryMediaReadAlbumRead,
    LibraryMediaReadArtistRead,
    LibraryMediaReadSongRead,
    LibraryRead,
    ServiceRead,
    ServiceSearchResultsServiceSongRead,
    ServiceToken,
    SongRead,
    SongUpdate,
    SourceCreate,
    SourceRead,
    SourceUpdate,
    UserProfile,
    UserProfileUpdate,
    UserSignUp,
    paths,
} from "@/api/openapi"
import type { UserSessionManager } from "@/api/userSession"

export type ReadLibrarySongsSortBy = NonNullable<
    Required<paths["/libraries/{library_id}/songs"]["get"]["parameters"]["query"]>
>["sort_by"]

function unwrap<
    // biome-ignore lint/suspicious/noExplicitAny: Required due to imported API
    T extends Record<string | number, any>,
    Options,
    Media extends `${string}/${string}`,
>(fetchResponse: FetchResponse<T, Options, Media>) {
    if (fetchResponse.data === undefined) {
        throw new Error(`Could not unwrap fetch response: ${fetchResponse}`)
    }
    return fetchResponse.data
}

function toFormData<TBody extends NonNullable<object>>(body: TBody) {
    const formBody = new FormData()
    for (const [key, value] of Object.entries(body)) {
        if (!value) {
            continue
        }
        formBody.set(key, String(value))
    }
    return formBody as unknown as TBody
}

export class APIClient {
    private readonly _client: Client<paths>

    constructor(userSessionManager: UserSessionManager) {
        this._client = createClient<paths>({
            baseUrl: import.meta.env.VITE_API_URL,
        })

        const sessionMiddleware: Middleware = {
            async onRequest({ request }) {
                const userSession = userSessionManager.current
                if (userSession !== null) {
                    request.headers.append("Authorization", `Bearer ${userSession.accessToken}`)
                }
            },
            async onResponse({ response }) {
                if (!response.ok) {
                    if (response.status === 401) {
                        userSessionManager.current = null
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
            },
        }

        this._client.use(sessionMiddleware)
    }

    // -- Root Routes -- //

    async signUp(body: UserSignUp): Promise<UserProfile> {
        const response = await this._client.POST("/sign-up", {
            body,
        })
        return unwrap(response)
    }

    async signIn(body: BodySignInSignInPost) {
        const response = await this._client.POST("/sign-in", {
            body: toFormData(body),
        })
        return unwrap(response)
    }

    // -- User Routes -- //

    async readMe(): Promise<UserProfile> {
        const response = await this._client.GET("/users/me")
        return unwrap(response)
    }

    async updateMe(body: UserProfileUpdate): Promise<UserProfile> {
        const response = await this._client.POST("/users/me", {
            body,
        })
        return unwrap(response)
    }

    // -- Library Routes -- //

    async readLibraries(): Promise<readonly LibraryRead[]> {
        const response = await this._client.GET("/libraries/")
        return unwrap(response)
    }

    async readLibraryHomeSubpaths(relative_to: string): Promise<LibraryHomePathRead> {
        const response = await this._client.GET("/libraries/home-subpaths", {
            params: { query: { relative_to } },
        })
        return unwrap(response)
    }

    async createLibrary(body: LibraryCreate): Promise<LibraryRead> {
        const response = await this._client.POST("/libraries/create", {
            body,
        })
        return unwrap(response)
    }

    async readLibrary(library_id: number): Promise<LibraryRead> {
        const response = await this._client.GET("/libraries/{library_id}", {
            params: {
                path: {
                    library_id,
                },
            },
        })
        return unwrap(response)
    }

    async updateLibraryAlbum(
        library_id: number,
        album_id: number,
        body: AlbumUpdate,
    ): Promise<AlbumRead> {
        const response = await this._client.PATCH("/libraries/{library_id}/albums/{album_id}", {
            params: { path: { library_id, album_id } },
            body,
        })
        return unwrap(response)
    }

    async deleteLibraryAlbum(library_id: number, album_id: number): Promise<void> {
        await this._client.DELETE("/libraries/{library_id}/albums/{album_id}", {
            params: { path: { library_id, album_id } },
        })
    }

    async readLibraryAlbums(
        library_id: number,
        artist_id?: number,
        offset?: number,
        limit?: number,
    ): Promise<LibraryMediaReadAlbumRead> {
        const response = await this._client.GET("/libraries/{library_id}/albums", {
            params: {
                path: {
                    library_id,
                },
                query: {
                    artist_id,
                    offset,
                    limit,
                },
            },
        })
        return unwrap(response)
    }

    async updateLibraryArtist(
        library_id: number,
        artist_id: number,
        body: ArtistUpdate,
    ): Promise<ArtistRead> {
        const response = await this._client.PATCH("/libraries/{library_id}/artists/{artist_id}", {
            params: { path: { library_id, artist_id } },
            body,
        })
        return unwrap(response)
    }

    async deleteLibraryArtist(library_id: number, artist_id: number): Promise<void> {
        await this._client.DELETE("/libraries/{library_id}/artists/{artist_id}", {
            params: { path: { library_id, artist_id } },
        })
    }

    async readLibraryArtists(
        library_id: number,
        offset?: number,
        limit?: number,
    ): Promise<LibraryMediaReadArtistRead> {
        const response = await this._client.GET("/libraries/{library_id}/artists", {
            params: {
                path: {
                    library_id,
                },
                query: {
                    offset,
                    limit,
                },
            },
        })
        return unwrap(response)
    }

    async updateLibrarySong(
        library_id: number,
        song_id: number,
        body: SongUpdate,
    ): Promise<SongRead> {
        const response = await this._client.PATCH("/libraries/{library_id}/songs/{song_id}", {
            params: { path: { library_id, song_id } },
            body,
        })
        return unwrap(response)
    }

    async deleteLibrarySong(library_id: number, song_id: number): Promise<void> {
        await this._client.DELETE("/libraries/{library_id}/songs/{song_id}", {
            params: { path: { library_id, song_id } },
        })
    }

    async readLibrarySongs(
        library_id: number,
        album_id?: number,
        artist_id?: number,
        sort_by?: ReadLibrarySongsSortBy,
        offset?: number,
        limit?: number,
    ): Promise<LibraryMediaReadSongRead> {
        const response = await this._client.GET("/libraries/{library_id}/songs", {
            params: {
                path: {
                    library_id,
                },
                query: {
                    album_id,
                    artist_id,
                    sort_by,
                    offset,
                    limit,
                },
            },
        })
        return unwrap(response)
    }

    // -- Service Routes -- //

    async readAvailableServices(): Promise<readonly ServiceRead[]> {
        const response = await this._client.GET("/services/available")
        return unwrap(response)
    }

    async readServiceToken(name: string): Promise<ServiceToken> {
        const response = await this._client.POST("/services/{name}/token", {
            params: { path: { name } },
        })
        return unwrap(response)
    }

    async searchServiceSongs(
        name: string,
        query: string,
        offset?: number,
        limit?: number,
    ): Promise<ServiceSearchResultsServiceSongRead> {
        const response = await this._client.GET("/services/{name}/search/songs", {
            params: { path: { name }, query: { query, offset, limit } },
        })
        return unwrap(response)
    }

    // -- Artwork Routes -- //

    async createArtwork(body: ArtworkCreate): Promise<ArtworkRead> {
        const response = await this._client.POST("/artworks/create", {
            body,
        })
        return unwrap(response)
    }

    async updateArtwork(artwork_id: number, body: ArtworkUpdate): Promise<ArtworkRead> {
        const response = await this._client.PATCH("/artworks/{artwork_id}", {
            params: { path: { artwork_id } },
            body,
        })
        return unwrap(response)
    }

    async deleteArtwork(artwork_id: number): Promise<void> {
        await this._client.DELETE("/artworks/{artwork_id}", {
            params: { path: { artwork_id } },
        })
    }

    // -- Source Routes -- //

    async createSource(body: SourceCreate): Promise<SourceRead> {
        const response = await this._client.POST("/sources/create", {
            body,
        })
        return unwrap(response)
    }

    async updateSource(source_id: number, body: SourceUpdate): Promise<SourceRead> {
        const response = await this._client.PATCH("/sources/{source_id}", {
            params: { path: { source_id } },
            body,
        })
        return unwrap(response)
    }

    async deleteSource(source_id: number): Promise<void> {
        await this._client.DELETE("/sources/{source_id}", {
            params: { path: { source_id } },
        })
    }

    // -- Ingestion Routes -- //

    async ingestSongs(library_id: number, body: BulkIngestSongs): Promise<readonly SongRead[]> {
        const response = await this._client.POST("/libraries/{library_id}/ingest/songs", {
            params: { path: { library_id } },
            body,
        })
        return unwrap(response)
    }
}
