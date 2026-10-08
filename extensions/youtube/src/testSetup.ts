import { vi } from "vitest"

// Every client takes its own `fetch`, so anything reaching the real one is a bug
vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
    throw new Error(`Test tried to reach the network: ${String(input)}`)
})
