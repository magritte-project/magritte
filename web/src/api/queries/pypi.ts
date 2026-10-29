import { queryOptions } from "@tanstack/react-query"
import { z } from "zod"

const PyPIProjectIndexSchema = z.object({
    files: z.array(
        z.object({
            "core-metadata": z.union([z.literal(false), z.record(z.string(), z.string())]),
            "data-dist-info-metadata": z.union([
                z.literal(false),
                z.record(z.string(), z.string()),
            ]),
            filename: z.string(),
            hashes: z.record(z.string(), z.string()),
            "requires-python": z.string(),
            size: z.number(),
            "upload-time": z.iso.datetime(),
            url: z.url(),
            yanked: z.boolean(),
        }),
    ),
    meta: z.object({
        "_last-serial": z.number(),
        "api-version": z.string(),
    }),
    name: z.string(),
    "project-status": z.object({
        status: z.string(),
    }),
    versions: z.array(z.string()),
})

export function readPyPIProjectIndex(projectName: string) {
    return queryOptions({
        queryKey: ["pypi", "index", projectName],
        queryFn: async () => {
            const response = await fetch(
                `https://pypi.org/simple/${encodeURIComponent(projectName)}/`,
                {
                    headers: [["Accept", "application/vnd.pypi.simple.v1+json"]],
                    redirect: "follow",
                },
            )
            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`)
            }
            const data = await response.json()
            return PyPIProjectIndexSchema.parse(data)
        },
    })
}
