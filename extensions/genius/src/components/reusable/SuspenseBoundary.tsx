import { QueryErrorResetBoundary } from "@tanstack/react-query"
import { Component, Suspense, type ErrorInfo, type ReactNode } from "react"

import ContentUnavailable, {
    type ContentUnavailableVariant,
} from "@/components/reusable/ContentUnavailable"

export type ErrorFallback = ReactNode | ((error: unknown, reset: () => void) => ReactNode)

export interface SuspenseBoundaryProps {
    readonly children: ReactNode
    /** Rendered while children are suspended. Defaults to a spinner. */
    readonly fallback?: ReactNode
    /**
     * Rendered when children throw. May be a function receiving the error and a
     * `reset` callback that retries failed queries and re-renders the children.
     * Defaults to an error message.
     */
    readonly errorFallback?: ErrorFallback
    /** Variant used by the default fallbacks. */
    readonly variant?: ContentUnavailableVariant
}

/**
 * A suspense boundary that also catches errors thrown while rendering its
 * children, showing a loading state and an error state respectively.
 */
export default function SuspenseBoundary({
    children,
    fallback,
    errorFallback,
    variant,
}: SuspenseBoundaryProps) {
    return (
        <QueryErrorResetBoundary>
            {({ reset }) => (
                <ErrorBoundary
                    onReset={reset}
                    fallback={
                        errorFallback ??
                        ((error) => <ContentUnavailable variant={variant} error={error} />)
                    }
                >
                    <Suspense fallback={fallback ?? <ContentUnavailable variant={variant} />}>
                        {children}
                    </Suspense>
                </ErrorBoundary>
            )}
        </QueryErrorResetBoundary>
    )
}

interface ErrorBoundaryProps {
    readonly children: ReactNode
    readonly fallback: ErrorFallback
    /** Called before the children are re-rendered after an error. */
    readonly onReset?: () => void
}

interface ErrorBoundaryState {
    readonly error?: { readonly value: unknown }
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = {}

    static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
        // Boxed so that falsy thrown values still count as an error
        return { error: { value: error } }
    }

    componentDidCatch(error: unknown, info: ErrorInfo) {
        console.error("*** SuspenseBoundary caught an error", error, info.componentStack)
    }

    reset = () => {
        // Lets failed queries refetch instead of immediately rethrowing their error
        this.props.onReset?.()
        this.setState({ error: undefined })
    }

    render() {
        const { error } = this.state
        if (!error) {
            return this.props.children
        }

        const { fallback } = this.props
        return typeof fallback === "function" ? fallback(error.value, this.reset) : fallback
    }
}
