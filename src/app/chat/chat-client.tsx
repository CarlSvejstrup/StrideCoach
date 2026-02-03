'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useRef, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, Loader2, ArrowLeft, Trash2, BrainCircuit } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from 'react-markdown'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function ChatClient() {
    const [thinking, setThinking] = useState(false)
    const [input, setInput] = useState('')

    // Standard useChat configuration
    const { messages, sendMessage, setMessages, status } = useChat({
        transport: new DefaultChatTransport({ api: '/api/chat' }),
        onError: (err) => {
            console.error("Chat error:", err)
            alert("Error sending message: " + err.message)
        }
    })

    const scrollRef = useRef<HTMLDivElement>(null)
    const isSending = status === 'submitted' || status === 'streaming'

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const handleReset = () => {
        if (confirm("Clear chat history?")) {
            setMessages([])
        }
    }

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setInput(event.target.value)
    }

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (isSending) return

        const trimmed = input.trim()
        if (!trimmed) return

        setInput('')
        try {
            await sendMessage(
                { text: trimmed },
                { body: { thinking } }
            )
        } catch (error) {
            console.error("Chat send failed:", error)
            setInput(trimmed)
        }
    }

    const getMessageText = (message: UIMessage) => {
        return message.parts
            .map((part) => (part.type === 'text' ? part.text : ''))
            .join('')
    }

    const hasToolParts = (message: UIMessage) => {
        return message.parts.some((part) => part.type === 'dynamic-tool' || part.type.startsWith('tool-'))
    }

    return (
        <div className="container flex flex-col h-[calc(100vh-4rem)] items-center justify-center p-4 gap-4">
            {/* Header / Navigation */}
            <div className="w-full max-w-2xl flex justify-start">
                <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>
            </div>

            <Card className="w-full max-w-2xl h-full max-h-[800px] flex flex-col">
                <CardHeader className="border-b flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        Coach AI
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2 pl-4 border-r pr-4 h-6">
                            <Switch id="thinking-mode" checked={thinking} onCheckedChange={setThinking} />
                            <Label htmlFor="thinking-mode" className="text-xs font-medium flex items-center gap-1 cursor-pointer">
                                <BrainCircuit className="h-3 w-3" />
                                Thinking
                            </Label>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="text-muted-foreground hover:text-destructive"
                            title="Reset Chat"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Reset
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden relative">
                    <ScrollArea className="h-full p-4">
                        {messages.length === 0 && (
                            <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic pt-10">
                                Start a conversation with your coach.
                            </div>
                        )}

                        <div className="flex flex-col gap-4">
                            {messages.map((m) => {
                                const messageText = getMessageText(m)
                                const showToolIndicator = !messageText && hasToolParts(m)

                                return (
                                    <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {m.role === 'assistant' && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={16} /></AvatarFallback>
                                            </Avatar>
                                        )}

                                        <div className={`rounded-lg px-4 py-2 max-w-[80%] text-sm ${m.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-foreground'
                                            } ${m.role === 'assistant' ? 'prose prose-sm dark:prose-invert max-w-none' : ''}`}>
                                            {/* Render content safely */}
                                            {messageText ? <ReactMarkdown>{messageText}</ReactMarkdown> : <span className="italic text-xs">Processing...</span>}

                                            {/* Show simple indicator if tool calls are happening but no content yet */}
                                            {showToolIndicator && (
                                                <div className="text-xs italic mt-1 opacity-70">Running tools...</div>
                                            )}
                                        </div>

                                        {m.role === 'user' && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-muted"><User size={16} /></AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                )
                            })}

                            {/* Loading State Indicator */}
                            {isSending && messages[messages.length - 1]?.role !== 'assistant' && (
                                <div className="flex gap-3 justify-start opacity-50">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback><Bot size={16} /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex items-center">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>
                </CardContent>

                <CardFooter className="p-4 border-t">
                    <form
                        onSubmit={onSubmit}
                        className="flex w-full gap-2 items-center"
                    >
                        <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Ask your coach..."
                            className="flex-1"
                            disabled={isSending}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={isSending || !input.trim()}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    )
}
