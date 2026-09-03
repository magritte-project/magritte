export interface PromiseResolver<T> {
    promise: Promise<T>
    resolve: (value: T) => void
    reject: (reason?: unknown) => void
}

export function promiseResolver<T>(): PromiseResolver<T> {
    let resolve: (value: T) => void
    let reject: (reason?: unknown) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve: resolve!, reject: reject! }
}
