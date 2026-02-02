'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function importActivities() {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Not authenticated")
    }

    // 1. Get Strava Account
    const account = await prisma.account.findFirst({
        where: {
            userId: session.user.id,
            provider: "strava"
        }
    })

    if (!account || !account.access_token || !account.refresh_token || !account.expires_at) {
        throw new Error("No linked Strava account found. Please sign in again.")
    }

    let accessToken = account.access_token

    // 2. Check Expiry & Refresh if needed
    // Buffer of 60 seconds
    if (Date.now() / 1000 > account.expires_at - 60) {
        console.log("Refreshing Strava token...")
        try {
            const response = await fetch("https://www.strava.com/oauth/token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client_id: process.env.STRAVA_CLIENT_ID,
                    client_secret: process.env.STRAVA_CLIENT_SECRET,
                    grant_type: "refresh_token",
                    refresh_token: account.refresh_token,
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to refresh token")
            }

            const refreshed = await response.json()

            // Update DB
            await prisma.account.update({
                where: { id: account.id },
                data: {
                    access_token: refreshed.access_token,
                    refresh_token: refreshed.refresh_token,
                    expires_at: refreshed.expires_at,
                }
            })

            accessToken = refreshed.access_token
        } catch (error) {
            console.error("Token refresh failed", error)
            throw new Error("Failed to refresh Strava session. Please log out and back in.")
        }
    }

    // 3. Fetch Activities (Last 30 days or simple page 1)
    const STRAVA_API = "https://www.strava.com/api/v3"
    const activitiesResponse = await fetch(`${STRAVA_API}/athlete/activities?per_page=30`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    })

    if (!activitiesResponse.ok) {
        throw new Error(`Strava API Error: ${activitiesResponse.statusText}`)
    }

    const activities = await activitiesResponse.json()
    let importCount = 0

    // 4. Upsert to DB
    for (const activity of activities) {
        // Basic mapping
        await prisma.activity.upsert({
            where: { stravaId: BigInt(activity.id) },
            update: {
                name: activity.name,
                type: activity.type,
                startTime: new Date(activity.start_date),
                distanceM: activity.distance,
                movingS: activity.moving_time,
                averageHr: activity.average_heartrate || null,
            },
            create: {
                stravaId: BigInt(activity.id),
                userId: session.user.id,
                name: activity.name,
                type: activity.type,
                startTime: new Date(activity.start_date),
                distanceM: activity.distance,
                movingS: activity.moving_time,
                averageHr: activity.average_heartrate || null,
            }
        })
        importCount++
    }

    revalidatePath("/dashboard")
    revalidatePath("/import")

    return { success: true, count: importCount }
}
