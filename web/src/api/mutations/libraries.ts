import { createLibrary } from "@/api/client"
import { useMutation } from "@tanstack/react-query"

export function useCreateLibrary() {
    return useMutation({
        mutationFn: createLibrary,
    })
}
