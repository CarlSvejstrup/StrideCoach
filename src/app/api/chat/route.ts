import { google } from "@ai-sdk/google"
import { streamText, tool } from "ai"
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

    const { messages, thinking } = await req.json()
    console.log("DEBUG: Received", messages.length, "messages. Thinking Mode:", thinking)
    const context = await getLastActivitiesContext(session.user.id)
    const memory = await getMemory()
    const trainingPlan = await getTrainingPlan()

    const systemPrompt = generateSystemPrompt({
        context,
        memory,
        trainingPlan,
        thinking
    })

    // In AI SDK v6, messages can be passed directly if they match CoreMessage or are converted automatically.
    // The 'messages' from useChat hook are compatible with the SDK's expected format for streamText.
    try {
        console.log("DEBUG: Starting stream with", messages.length, "messages")
        const result = await streamText({
            model: google("gemini-2.5-flash-lite"),
            system: systemPrompt,
            messages,
            maxSteps: 5,
            providerOptions: thinking ? {
                google: {
                    thinkingConfig: {
                        thinkingBudget: 10000
                    }
                }
            } : undefined,
            tools: {
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
            },
        } as any)

        return (result as any).toDataStreamResponse()
    } catch (error) {
        console.error("DEBUG: AI Generation Error:", error)
        return new Response(JSON.stringify({ error: (error as any).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
