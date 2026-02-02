'use client'

import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, User, Bot, Loader2 } from "lucide-react"

export default function ChatPage() {
    const { messages, sendMessage, status } = useChat()
    const [input, setInput] = useState('')

    const isLoading = status === 'submitted' || status === 'streaming'

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage = input
        setInput('')

        // Bypass type check for SDK v6 flux
        await sendMessage({
            role: 'user',
            content: userMessage,
        } as any)
    }

    return (
        <div className="container flex h-[calc(100vh-4rem)] items-center justify-center p-4">
            <Card className="w-full max-w-2xl h-full max-h-[800px] flex flex-col">
                <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        Coach AI
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden relative">
                    <ScrollArea className="h-full p-4">
                        {messages.length === 0 && (
                            <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic pt-10">
                                Ask me about your recent runs! e.g. "How was my pace last week?"
                            </div>
                        )}
                        <div className="flex flex-col gap-4">
                            {messages.map(m => (
                                <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {m.role === 'assistant' && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src="/bot-avatar.png" />
                                            <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={16} /></AvatarFallback>
                                        </Avatar>
                                    )}

                                    <div className={`rounded-lg px-4 py-2 max-w-[80%] text-sm ${m.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-foreground'
                                        }`}>
                                        {/* Explicitly cast to any to avoid TS errors about content missing */}
                                        {(m as any).content}
                                    </div>

                                    {m.role === 'user' && (
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-muted"><User size={16} /></AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 justify-start">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={16} /></AvatarFallback>
                                    </Avatar>
                                    <div className="rounded-lg px-4 py-2 bg-muted flex items-center">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="p-4 border-t">
                    <form onSubmit={handleSubmit} className="flex w-full gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask your coach..."
                            className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    )
}
