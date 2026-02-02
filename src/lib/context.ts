import { prisma } from "@/lib/db"

export async function getLastActivitiesContext(userId: string, limit = 30) {
    const activities = await prisma.activity.findMany({
        where: { userId },
        orderBy: { startTime: 'desc' },
        take: limit,
    })

    // Format relevant fields to save token space
    const formatted = activities.map(a => ({
        date: a.startTime.toISOString().split('T')[0],
        type: a.type,
        distance_km: (a.distanceM / 1000).toFixed(2),
        duration_min: (a.movingS / 60).toFixed(1),
        pace: calculatePace(a.movingS, a.distanceM),
        avg_hr: a.averageHr ? Math.round(a.averageHr) : 'N/A'
    }))

    return JSON.stringify(formatted, null, 2)
}

function calculatePace(seconds: number, meters: number) {
    if (meters === 0) return "0:00/km"
    const paceSeconds = seconds / (meters / 1000)
    const minutes = Math.floor(paceSeconds / 60)
    const secs = Math.floor(paceSeconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}/km`
}
