export function getErrorName(error: unknown): string {
    if (error instanceof Error) {
        return error.name
    } else {
        return "UnknownError"
    }
}

export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message
    } else if (typeof error === "object" && error !== null && "message" in error) {
        return String(error.message)
    } else {
        return String(error)
    }
}
