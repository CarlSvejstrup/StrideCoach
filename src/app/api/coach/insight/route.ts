import { NextResponse } from "next/server"
import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { getLastActivitiesContext } from "@/lib/context"
import { getMemory, getTrainingPlan } from "@/lib/memory"
import { computeCoachMetrics } from "@/lib/coach-metrics"
import { generateCoachInsightPrompt } from "@/lib/coach-prompts"

const insightSchema = z.object({
    headline: z.string(),
    summary: z.string(),
    evidence: z.array(z.string()),
    takeaways: z.array(z.string()),
    nextStep: z.string(),
    progressNote: z.string(),
    flags: z.array(z.string()),
    planCompliance: z.object({
        score: z.number().min(0).max(100),
        note: z.string()
    })
})

export async function POST() {
    const session = await auth()
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const activities = await prisma.activity.findMany({
        where: { userId: session.user.id },
        orderBy: { startTime: 'desc' }
    })

    const metrics = computeCoachMetrics(activities)
    const context = await getLastActivitiesContext(session.user.id)
    const memory = await getMemory()
    const trainingPlan = await getTrainingPlan(session.user.id)

    const prompt = generateCoachInsightPrompt({
        context,
        memory,
        trainingPlan,
        metrics
    })

    try {
        const result = await generateObject({
            model: google("gemini-2.5-flash-lite"),
            schema: insightSchema,
            prompt,
            maxOutputTokens: 800
        })

        return NextResponse.json({
            insight: result.object,
            metrics
        })
    } catch (error) {
        console.error("Coach insight error:", error)
        return NextResponse.json(
            { error: "Failed to generate coach insight" },
            { status: 500 }
        )
    }
}
