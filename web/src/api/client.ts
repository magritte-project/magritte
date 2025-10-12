import createClient, { type FetchResponse } from "openapi-fetch"
import type {
    BodySignInSignInPost,
    LibraryCreate,
    LibraryMediaReadSongRead,
    LibraryRead,
    UserProfile,
    UserProfileUpdate,
    UserSignUp,
    paths,
} from "./openapi"
import { retrieveUserSession } from "./userSession"

const apiClient = createClient<paths>({
    baseUrl: "/api",
})

function getSessionHeaders() {
    const headers = new Headers()
    const userSession = retrieveUserSession()
    if (userSession !== null) {
        headers.append("Authorization", `Bearer ${userSession.accessToken}`)
    }
    return headers
}

function unwrap<
    // biome-ignore lint/suspicious/noExplicitAny: Required due to imported API
    T extends Record<string | number, any>,
    Options,
    Media extends `${string}/${string}`,
>(fetchResponse: FetchResponse<T, Options, Media>) {
    if (fetchResponse.data !== undefined && fetchResponse.error === undefined) {
        return fetchResponse.data
    }

    const errorResponse = fetchResponse.error as unknown
    let message = `${fetchResponse.response.status}: ${fetchResponse.response.statusText}`
    if (
        typeof errorResponse === "object" &&
        errorResponse !== null &&
        "detail" in errorResponse
    ) {
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
    }
    throw new Error(message)
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
    const response = await apiClient.GET("/users/me", {
        headers: getSessionHeaders(),
    })
    return unwrap(response)
}

export async function updateMe(body: UserProfileUpdate): Promise<UserProfile> {
    const response = await apiClient.POST("/users/me", {
        body,
        headers: getSessionHeaders(),
    })
    return unwrap(response)
}

// -- Library Routes -- //

export async function createLibrary(body: LibraryCreate): Promise<LibraryRead> {
    const response = await apiClient.POST("/libraries/create", {
        body,
        headers: getSessionHeaders(),
    })
    return unwrap(response)
}

export async function readLibrary(library_id: number): Promise<LibraryRead> {
    const response = await apiClient.GET("/libraries/{library_id}", {
        params: {
            path: {
                library_id,
            },
            headers: getSessionHeaders(),
        },
    })
    return unwrap(response)
}

export async function readLibrarySongs(
    library_id: number,
    offset: number,
    limit: number,
): Promise<LibraryMediaReadSongRead> {
    const response = await apiClient.GET("/libraries/{library_id}/songs", {
        params: {
            path: {
                library_id,
            },
            query: {
                offset,
                limit,
            },
        },
        headers: getSessionHeaders(),
    })
    return unwrap(response)
}
