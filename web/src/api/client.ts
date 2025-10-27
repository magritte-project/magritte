import type {
    BodySignInSignInPost,
    LibraryCreate,
    LibraryMediaReadAlbumRead,
    LibraryMediaReadArtistRead,
    LibraryMediaReadSongRead,
    LibraryRead,
    UserProfile,
    UserProfileUpdate,
    UserSignUp,
    paths,
} from "@/api/openapi"
import type { UserSessionManager } from "@/api/userSession"
import createClient, {
    type Client,
    type FetchResponse,
    type Middleware,
} from "openapi-fetch"

export type ReadLibrarySongsSortBy = NonNullable<
    Required<
        paths["/libraries/{library_id}/songs"]["get"]["parameters"]["query"]
    >
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
                    request.headers.append(
                        "Authorization",
                        `Bearer ${userSession.accessToken}`,
                    )
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
                        console.warn(
                            `Could not include detail for error response, reason: ${e}`,
                        )
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

    // -- User Routes -- ?

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

    async readLibraryAlbums(
        library_id: number,
        artist_id?: number,
        offset?: number,
        limit?: number,
    ): Promise<LibraryMediaReadAlbumRead> {
        const response = await this._client.GET(
            "/libraries/{library_id}/albums",
            {
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
            },
        )
        return unwrap(response)
    }

    async readLibraryArtists(
        library_id: number,
        offset?: number,
        limit?: number,
    ): Promise<LibraryMediaReadArtistRead> {
        const response = await this._client.GET(
            "/libraries/{library_id}/artists",
            {
                params: {
                    path: {
                        library_id,
                    },
                    query: {
                        offset,
                        limit,
                    },
                },
            },
        )
        return unwrap(response)
    }

    async readLibrarySongs(
        library_id: number,
        album_id?: number,
        artist_id?: number,
        sort_by?: ReadLibrarySongsSortBy,
        offset?: number,
        limit?: number,
    ): Promise<LibraryMediaReadSongRead> {
        const response = await this._client.GET(
            "/libraries/{library_id}/songs",
            {
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
            },
        )
        return unwrap(response)
    }
}
