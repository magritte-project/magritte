import {
    appleMusicBaseUrl,
    type MusicPaginatedResponse,
    type UnknownMusicResource,
} from "@/musickit/models/base"

export interface FetchAllPagesOptions {
    readonly queryParameters?: Record<string, string>
    readonly maxItems?: number
}

/** Fetch a paginated resource collection, following `next` cursors until exhausted or `maxItems` is reached */
export async function fetchAllPages<Datum extends UnknownMusicResource>(
    musicKit: MusicKit.Instance,
    path: string,
    { queryParameters = {}, maxItems = Infinity }: FetchAllPagesOptions = {},
): Promise<Datum[]> {
    const items: Datum[] = []
    let nextPath: string | undefined = path
    let nextQueryParameters = queryParameters
    while (nextPath !== undefined && items.length < maxItems) {
        const result: { data: MusicPaginatedResponse<Datum> } = await musicKit.api.music<
            MusicPaginatedResponse<Datum>
        >(nextPath, nextQueryParameters)
        items.push(...result.data.data)
        if (result.data.next) {
            const nextUrl = new URL(result.data.next, appleMusicBaseUrl)
            nextPath = nextUrl.pathname
            nextQueryParameters = {
                ...queryParameters,
                ...Object.fromEntries(nextUrl.searchParams),
            }
        } else {
            nextPath = undefined
        }
    }
    return items.slice(0, maxItems)
}
