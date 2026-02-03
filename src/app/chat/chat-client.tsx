'use client'

import { useChat } from '@ai-sdk/react'
import { useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, Loader2, ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from 'react-markdown'

export default function ChatClient() {
    // 1. Core useChat hook - standard configuration
    const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading, stop, reload } = useChat({
        api: '/api/chat',
        onError: (err) => {
            console.error("Chat error:", err)
            alert("Error sending message: " + err.message)
        }
    })

    const scrollRef = useRef<HTMLDivElement>(null)

    // 2. Auto-scroll to bottom directly on message updates
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    // 3. Simple reset function
    const handleReset = () => {
        if (confirm("Clear chat history?")) {
            setMessages([])
        }
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
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden relative">
                    <ScrollArea className="h-full p-4">
                        {messages.length === 0 && (
                            <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic pt-10">
                                Start a conversation with your coach.
                            </div>
                        )}

                        <div className="flex flex-col gap-4">
                            {messages.map((m) => (
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
                                        {m.content ? <ReactMarkdown>{m.content}</ReactMarkdown> : <span className="italic text-xs">Processing...</span>}

                                        {/* Show simple indicator if tool calls are happening but no content yet */}
                                        {m.toolInvocations && m.toolInvocations.length > 0 && !m.content && (
                                            <div className="text-xs italic mt-1 opacity-70">Running tools...</div>
                                        )}
                                    </div>

                                    {m.role === 'user' && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-muted"><User size={16} /></AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}

                            {/* Loading State Indicator */}
                            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
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
                        onSubmit={(e) => {
                            console.log("Submitting form manually")
                            handleSubmit(e)
                        }}
                        className="flex w-full gap-2 items-center"
                    >
                        <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Ask your coach..."
                            className="flex-1"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={isLoading || !input?.trim()}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    )
}
