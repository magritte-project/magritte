import createClient, { type FetchResponse } from "openapi-fetch"
import type { paths } from "./openapi"

export const apiClient = createClient<paths>({
    baseUrl: "/api",
})

export function unwrap<
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

export function toFormData<TBody extends NonNullable<object>>(
    body: NonNullable<TBody>,
) {
    const formBody = new FormData()
    for (const [key, value] of Object.entries(body)) {
        if (!value) {
            continue
        }
        formBody.set(key, String(value))
    }
    return formBody as unknown as TBody
}
