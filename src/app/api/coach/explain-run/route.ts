import { NextResponse } from "next/server"
import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { getLastActivitiesContext } from "@/lib/context"
import { getMemory, getTrainingPlan } from "@/lib/memory"
import { calculatePace } from "@/lib/utils"

export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    const { activityId } = await req.json()
    if (!activityId || typeof activityId !== 'string') {
        return new NextResponse("Invalid activity id", { status: 400 })
    }

    const activity = await prisma.activity.findFirst({
        where: { id: activityId, userId: session.user.id }
    })

    if (!activity) {
        return new NextResponse("Activity not found", { status: 404 })
    }

    const recentRuns = await prisma.activity.findMany({
        where: { userId: session.user.id, type: { in: ['Run', 'TrailRun', 'VirtualRun'] } },
        orderBy: { startTime: 'desc' },
        take: 10
    })

    const avgRecentPace = (() => {
        const totalDistance = recentRuns.reduce((acc, run) => acc + run.distanceM, 0)
        const totalTime = recentRuns.reduce((acc, run) => acc + run.movingS, 0)
        if (totalDistance <= 0) return null
        return totalTime / (totalDistance / 1000)
    })()

    const context = await getLastActivitiesContext(session.user.id)
    const memory = await getMemory()
    const trainingPlan = await getTrainingPlan(session.user.id)

    const prompt = `
You are an elite running coach. Explain the following run in plain language.
Use only the data provided. Do not invent splits or terrain.

Run details:
- Date: ${activity.startTime.toISOString().slice(0, 10)}
- Name: ${activity.name}
- Type: ${activity.type}
- Distance: ${(activity.distanceM / 1000).toFixed(2)} km
- Time: ${Math.round(activity.movingS / 60)} min
- Pace: ${calculatePace(activity.movingS, activity.distanceM)} /km
- Avg HR: ${activity.averageHr ? Math.round(activity.averageHr) : 'N/A'}

Recent run benchmark:
- Avg pace (last 10 runs): ${avgRecentPace ? `${Math.floor(avgRecentPace / 60)}:${Math.round(avgRecentPace % 60).toString().padStart(2, '0')} /km` : 'N/A'}

Training plan:
${trainingPlan || "No training plan uploaded."}

Memory:
${memory || "No memory yet."}

Other recent activity context:
${context}

Return:
- 3-5 sentences explanation
- 2 bullet coaching suggestions
`

    try {
        const result = await generateText({
            model: google("gemini-2.5-flash-lite"),
            prompt,
            maxOutputTokens: 400
        })

        return NextResponse.json({ explanation: result.text })
    } catch (error) {
        console.error("Explain run error:", error)
        return NextResponse.json(
            { error: "Failed to explain run" },
            { status: 500 }
        )
    }
}
