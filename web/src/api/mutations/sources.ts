import type { SourceCreate } from "@magritte/api"
import { useMutation } from "@tanstack/react-query"

import useAPI from "@/hooks/apiHook"

export function useCreateSource() {
    const { client } = useAPI()
    return useMutation({
        mutationFn: (body: SourceCreate) => client.createSource(body),
    })
}
