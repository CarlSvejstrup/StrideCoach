import { google } from "@ai-sdk/google"
import { streamText } from "ai"
import { auth } from "@/auth"
import { getLastActivitiesContext } from "@/lib/context"

export const maxDuration = 30

export async function POST(req: Request) {
    const session = await auth()

    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 })
    }

    const { messages } = await req.json()
    const context = await getLastActivitiesContext(session.user.id)

    const systemPrompt = `
You are an elite running coach for StrideCoach. Your goal is to analyze the user's running data and provide actionable, encouraging, and technical feedback.

CONTEXT:
Here are the user's last 30 activities (JSON format):
${context}

INSTRUCTIONS:
- Reference specific runs by date or distance when answering.
- If the user asks about progress, compare recent runs to older ones in the context.
- Be concise but friendly.
- If data is missing (e.g. heart rate), mention it gently but don't hallucinate.
- Use metric units (km, min/km) as the primary standard unless asked otherwise.
`

    // In AI SDK v6, messages can be passed directly if they match CoreMessage or are converted automatically.
    // The 'messages' from useChat hook are compatible with the SDK's expected format for streamText.
    const result = await streamText({
        model: google("gemini-1.5-flash"),
        system: systemPrompt,
        messages,
    })

    return result.toTextStreamResponse()
}
