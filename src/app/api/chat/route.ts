import { google } from "@ai-sdk/google"
import { streamText, tool, convertToModelMessages } from "ai"
import { auth } from "@/auth"
import { getLastActivitiesContext } from "@/lib/context"
import { getMemory, saveMemory, getTrainingPlan } from "@/lib/memory"
import { z } from "zod"

import { generateSystemPrompt } from "@/lib/prompts"

export const maxDuration = 30

export async function POST(req: Request) {
    const session = await auth()
    console.log("DEBUG: API Chat Request. Session found:", !!session, "User ID:", session?.user?.id)

    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 })
    }

    const { messages: rawMessages = [], thinking } = await req.json()
    const safeMessages = Array.isArray(rawMessages) ? rawMessages : []
    const thinkingEnabled = Boolean(thinking)
    console.log("DEBUG: Received", safeMessages.length, "messages. Thinking Mode:", thinkingEnabled)
    const context = await getLastActivitiesContext(session.user.id)
    const memory = await getMemory()
    const trainingPlan = await getTrainingPlan(session.user.id)

    const systemPrompt = generateSystemPrompt({
        context,
        memory,
        trainingPlan,
        thinking: thinkingEnabled
    })

    try {
        const tools = {
            remember: tool({
                description: 'Save a fact about the user to long-term memory.',
                parameters: z.object({ fact: z.string().describe("The fact to remember") }),
                execute: async ({ fact }: { fact: string }) => {
                    console.log("DEBUG: Saving memory:", fact)
                    if (fact) {
                        await saveMemory(fact)
                    }
                    return "Memory saved."
                },
            }),
        }

        const messages = await convertToModelMessages(
            safeMessages.map((message: { id?: string }) => {
                const { id: _id, ...rest } = message
                void _id
                return rest
            }),
            { tools }
        )

        console.log("DEBUG: Starting stream with", messages.length, "messages")
        const result = await streamText({
            model: google("gemini-2.5-flash-lite"),
            system: systemPrompt,
            messages,
            maxSteps: 5,
            providerOptions: thinkingEnabled ? {
                google: {
                    thinkingConfig: {
                        thinkingBudget: 10000
                    }
                }
            } : undefined,
            tools,
        })

        return result.toUIMessageStreamResponse()
    } catch (error) {
        console.error("DEBUG: AI Generation Error:", error)
        const message = error instanceof Error ? error.message : "Unknown error"
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
