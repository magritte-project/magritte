import { ArrowUpIcon, StopIcon } from "@phosphor-icons/react"
import type { ModelMessage } from "ai"
import classNames from "classnames"
import { useCallback, useEffect, useRef, useState } from "react"

import { useAgent } from "@/hooks/agentHook"

export default function Thread() {
    const agent = useAgent()
    const [messages, setMessages] = useState<ModelMessage[]>([])
    const [streamingContent, setStreamingContent] = useState("")
    const [isStreaming, setIsStreaming] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [input, setInput] = useState("")
    const bottomRef = useRef<HTMLDivElement>(null)
    const abortRef = useRef<AbortController | null>(null)

    useEffect(() => {
        return () => abortRef.current?.abort()
    }, [])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, streamingContent])

    const send = useCallback(async () => {
        if (!input.trim() || isStreaming) return

        const userMessage: ModelMessage = { role: "user", content: input.trim() }
        const nextMessages = [...messages, userMessage]
        setMessages(nextMessages)
        setInput("")
        setIsStreaming(true)
        setStreamingContent("")
        setError(null)

        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        try {
            const stream = await agent.stream({
                messages: nextMessages,
                abortSignal: controller.signal,
            })

            let fullContent = ""
            for await (const chunk of stream.fullStream) {
                if (chunk.type === "text-delta") {
                    fullContent += chunk.text
                    setStreamingContent(fullContent)
                }
            }

            setMessages((prev) => [...prev, { role: "assistant", content: fullContent }])
        } catch (e) {
            if (e instanceof DOMException && e.name === "AbortError") return
            setError(e instanceof Error ? e.message : "An unexpected error occurred")
        } finally {
            setStreamingContent("")
            setIsStreaming(false)
        }
    }, [agent, messages, input, isStreaming])

    const abort = useCallback(() => {
        abortRef.current?.abort()
        setStreamingContent("")
        setIsStreaming(false)
    }, [])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void send()
            }
        },
        [send],
    )

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value)
        e.target.style.height = "auto"
        e.target.style.height = `${e.target.scrollHeight}px`
    }, [])

    return (
        <div className="flex h-screen flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 p-4">
                {messages.map((message, index) => (
                    <MessageBubble
                        key={index}
                        bubbleRole={message.role}
                        content={typeof message.content === "string" ? message.content : ""}
                    />
                ))}
                {streamingContent && (
                    <MessageBubble bubbleRole="assistant" content={streamingContent} streaming />
                )}
                <div ref={bottomRef} />
            </div>
            {error && (
                <div className="mx-3 mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    <span className="flex-1 wrap-anywhere">{error}</span>
                    <button
                        type="button"
                        className="shrink-0 text-red-400 hover:text-red-600"
                        onClick={() => setError(null)}
                    >
                        ✕
                    </button>
                </div>
            )}
            <div className="border-t border-gray-200 p-3">
                <div className="flex items-end gap-2 rounded-xl border border-gray-200 px-3 py-2">
                    <textarea
                        className="max-h-40 flex-1 resize-none bg-transparent py-1 text-sm outline-none disabled:opacity-50"
                        placeholder="Message Agent..."
                        rows={1}
                        value={input}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        disabled={isStreaming}
                    />
                    <button
                        className="rounded-lg bg-gray-900 p-1.5 text-white transition-opacity disabled:opacity-30"
                        onClick={isStreaming ? abort : send}
                        disabled={!input.trim() && !isStreaming}
                    >
                        {isStreaming ? (
                            <StopIcon size={16} weight="bold" />
                        ) : (
                            <ArrowUpIcon size={16} weight="bold" />
                        )}
                    </button>
                </div>
                <p className="mt-1.5 text-center text-xs text-gray-400">
                    Enter to send · Shift+Enter for new line
                </p>
            </div>
        </div>
    )
}

interface MessageBubbleProps {
    readonly bubbleRole: ModelMessage["role"]
    readonly content: string
    readonly streaming?: boolean
}

function MessageBubble({ bubbleRole: role, content, streaming }: MessageBubbleProps) {
    const isUser = role === "user"
    return (
        <div className={classNames("flex", { "justify-end": isUser, "justify-start": !isUser })}>
            <div
                className={classNames(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                    {
                        "rounded-br-sm bg-gray-900 text-white": isUser,
                        "rounded-bl-sm bg-gray-100 text-gray-900": !isUser,
                    },
                )}
            >
                {content}
                {streaming && (
                    <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-current align-middle" />
                )}
            </div>
        </div>
    )
}
