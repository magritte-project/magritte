import { transformersJS } from "@browser-ai/transformers-js"
import type { ExtensionHost } from "@magritte/sdk"
import { ToolLoopAgent, stepCountIs, tool } from "ai"
import { z } from "zod"

// oxlint-disable-next-line
import AgentWorker from "@/agent/worker?worker"

export interface AgentOptions {
    readonly extensionHost: ExtensionHost
}

export function createAgent({ extensionHost }: AgentOptions) {
    return new ToolLoopAgent({
        model: transformersJS("onnx-community/Qwen3-0.6B-ONNX", {
            dtype: "q4f16",
            device: "webgpu",
            worker: new AgentWorker(),
        }),
        instructions:
            "You are an assistant named René inside of a music player app called Magritte.",
        tools: {
            nowPlaying: tool({
                description: "Get the currently playing song, if any",
                inputSchema: z.object({}),
                execute: async () => {
                    const player = await extensionHost.player()
                    const nowPlaying = await player.getNowPlaying()
                    return nowPlaying.item
                },
            }),
            queryCommands: tool({
                description:
                    "Query for commands to use when the user asks for a specific action where a specific tool is not available",
                inputSchema: z.object({
                    query: z
                        .string()
                        .optional()
                        .describe(
                            "The user's request stated as a command like pause or skip track",
                        ),
                }),
                execute: async ({ query }) => {
                    const commandCoordinator = await extensionHost.commandCoordinator()
                    return await commandCoordinator.queryRunnable({ query })
                },
            }),
            runCommand: tool({
                description:
                    "Run a command by its ID on behalf of the user. The user does not know any command IDs, use the queryCommands tool to find the correct ID first.",
                inputSchema: z.object({
                    id: z.string().describe("The ID of the command from the queryCommands tool"),
                }),
                execute: async ({ id }) => {
                    const commandCoordinator = await extensionHost.commandCoordinator()
                    await commandCoordinator.runCommand({ id })
                    return { success: true }
                },
            }),
        },
        stopWhen: stepCountIs(5),
    })
}

export type Agent = ReturnType<typeof createAgent>
