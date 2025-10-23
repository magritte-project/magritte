import createClient, {
    type FetchResponse,
    type Middleware,
} from "openapi-fetch"
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
} from "./openapi"
import { StorageUserSessionManager } from "./userSession"

const apiClient = createClient<paths>({
    baseUrl: "/api",
})

const sessionMiddleware: Middleware = {
    async onRequest({ request }) {
        // TODO: This isn't referentially transparent
        const userSession = StorageUserSessionManager.local.current
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
                // TODO: This isn't referentially transparent
                StorageUserSessionManager.local.current = null
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

apiClient.use(sessionMiddleware)

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

// -- Root Routes -- //

export async function signUp(body: UserSignUp): Promise<UserProfile> {
    const response = await apiClient.POST("/sign-up", {
        body,
    })
    return unwrap(response)
}

export async function signIn(body: BodySignInSignInPost) {
    const response = await apiClient.POST("/sign-in", {
        body: toFormData(body),
    })
    return unwrap(response)
}

// -- User Routes -- ?

export async function readMe(): Promise<UserProfile> {
    const response = await apiClient.GET("/users/me")
    return unwrap(response)
}

export async function updateMe(body: UserProfileUpdate): Promise<UserProfile> {
    const response = await apiClient.POST("/users/me", {
        body,
    })
    return unwrap(response)
}

// -- Library Routes -- //

export async function readLibraries(): Promise<readonly LibraryRead[]> {
    const response = await apiClient.GET("/libraries/")
    return unwrap(response)
}

export async function createLibrary(body: LibraryCreate): Promise<LibraryRead> {
    const response = await apiClient.POST("/libraries/create", {
        body,
    })
    return unwrap(response)
}

export async function readLibrary(library_id: number): Promise<LibraryRead> {
    const response = await apiClient.GET("/libraries/{library_id}", {
        params: {
            path: {
                library_id,
            },
        },
    })
    return unwrap(response)
}

export async function readLibraryAlbums(
    library_id: number,
    artist_id?: number,
    offset?: number,
    limit?: number,
): Promise<LibraryMediaReadAlbumRead> {
    const response = await apiClient.GET("/libraries/{library_id}/albums", {
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

export async function readLibraryArtists(
    library_id: number,
    offset?: number,
    limit?: number,
): Promise<LibraryMediaReadArtistRead> {
    const response = await apiClient.GET("/libraries/{library_id}/artists", {
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

export async function readLibrarySongs(
    library_id: number,
    album_id?: number,
    artist_id?: number,
    offset?: number,
    limit?: number,
): Promise<LibraryMediaReadSongRead> {
    const response = await apiClient.GET("/libraries/{library_id}/songs", {
        params: {
            path: {
                library_id,
            },
            query: {
                album_id,
                artist_id,
                offset,
                limit,
            },
        },
    })
    return unwrap(response)
}
