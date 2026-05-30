import { useCallback, useState } from "react"

export type UsePresentationResult<TResult, TInput> =
    | {
          readonly isPresented: false
          readonly dismiss: (result: TResult) => void
          readonly present: (input: TInput) => Promise<TResult>
      }
    | {
          readonly isPresented: true
          readonly input: TInput
          readonly dismiss: (result: TResult) => void
          readonly present: (input: TInput) => Promise<TResult>
      }

interface Presentation<TResult, TInput> {
    readonly input: TInput
    readonly resolve: (result: TResult | PromiseLike<TResult>) => void
    readonly reject: (reason?: unknown) => void
}

export default function usePresentation<TResult, TInput = void>(): UsePresentationResult<
    TResult,
    TInput
> {
    const [presentation, setPresentation] = useState<Presentation<TResult, TInput> | null>(null)

    const dismiss = useCallback(
        (result: TResult) => {
            if (presentation) {
                presentation.resolve(result)
            }
        },
        [presentation],
    )

    const present = useCallback(async (input: TInput) => {
        return new Promise<TResult>((resolve, reject) => {
            setPresentation({ input, resolve, reject })
        }).finally(() => {
            setPresentation(null)
        })
    }, [])

    if (presentation !== null) {
        return { isPresented: true, input: presentation.input, dismiss, present }
    } else {
        return { isPresented: false, dismiss, present }
    }
}
