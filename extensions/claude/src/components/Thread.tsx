import type { MessageParam } from "@anthropic-ai/sdk/resources"
import { ArrowUpIcon } from "@phosphor-icons/react"
import classNames from "classnames"
import { useCallback, useEffect, useRef, useState } from "react"

import useAnthropic from "@/hooks/anthropicHook"

export interface ThreadProps {
    readonly onDeauthorize: () => void
}

export default function Thread({ onDeauthorize }: ThreadProps) {
    const anthropic = useAnthropic()
    const [messages, setMessages] = useState<MessageParam[]>([])
    const [streamingContent, setStreamingContent] = useState("")
    const [isStreaming, setIsStreaming] = useState(false)
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

        const userMessage: MessageParam = { role: "user", content: input.trim() }
        const nextMessages = [...messages, userMessage]
        setMessages(nextMessages)
        setInput("")
        setIsStreaming(true)
        setStreamingContent("")

        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        try {
            const stream = anthropic.messages.stream(
                { model: "claude-sonnet-4-6", max_tokens: 8096, messages: nextMessages },
                { signal: controller.signal },
            )

            let fullContent = ""
            for await (const chunk of stream) {
                if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
                    fullContent += chunk.delta.text
                    setStreamingContent(fullContent)
                }
            }

            setMessages((prev) => [...prev, { role: "assistant", content: fullContent }])
        } catch (e) {
            if (!(e instanceof DOMException && e.name === "AbortError")) throw e
        } finally {
            setStreamingContent("")
            setIsStreaming(false)
        }
    }, [anthropic.messages, messages, input, isStreaming])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send()
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
            <header className="flex items-center gap-3 px-3 text-sm">
                <div className="flex-1 font-bold">Thread</div>
                <button
                    type="button"
                    onClick={onDeauthorize}
                    className={classNames(
                        "px-3 py-2 flex items-center gap-0.5",
                        "rounded-full bg-gray-50 active:bg-gray-100 data-open:bg-gray-200 disabled:bg-transparent",
                        "font-bold disabled:text-gray-300",
                    )}
                >
                    Deauthorize
                </button>
            </header>
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
            <div className="border-t border-gray-200 p-3">
                <div className="flex items-end gap-2 rounded-xl border border-gray-200 px-3 py-2">
                    <textarea
                        className="max-h-40 flex-1 resize-none bg-transparent py-1 text-sm outline-none disabled:opacity-50"
                        placeholder="Message Claude..."
                        rows={1}
                        value={input}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        disabled={isStreaming}
                    />
                    <button
                        className="rounded-lg bg-gray-900 p-1.5 text-white transition-opacity disabled:opacity-30"
                        onClick={send}
                        disabled={!input.trim() || isStreaming}
                    >
                        <ArrowUpIcon size={16} weight="bold" />
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
    readonly bubbleRole: MessageParam["role"]
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
