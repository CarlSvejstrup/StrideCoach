import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/db"

import { DashboardContent } from "@/components/DashboardContent"
import { TrainingCalendar } from "@/components/training-calendar"
import { parseTrainingPlan } from "@/lib/training-parser"

async function getActivities(userId: string) {
    return await prisma.activity.findMany({
        where: { userId },
        orderBy: { startTime: 'desc' },
    })
}

async function getUserTrainingPlan(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { trainingProgram: true }
    })
    return parseTrainingPlan(user?.trainingProgram || null)
}

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/")
    }

    const [activities, trainingPlan] = await Promise.all([
        getActivities(session.user.id),
        getUserTrainingPlan(session.user.id)
    ])

    return (
        <div className="container p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back, {session.user.name}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/import">
                        <Button variant="outline">Import Data</Button>
                    </Link>
                    <Link href="/chat">
                        <Button>AI Coach</Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-6">
                <TrainingCalendar weeks={trainingPlan} />
                <DashboardContent activities={activities} />
            </div>
        </div>
    )
}
