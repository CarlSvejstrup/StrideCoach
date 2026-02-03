import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, Calendar, Activity as ActivityIcon, Timer } from "lucide-react"

import { DashboardContent } from "@/components/DashboardContent"

async function getActivities(userId: string) {
    return await prisma.activity.findMany({
        where: { userId },
        orderBy: { startTime: 'desc' },
    })
}

export default async function DashboardPage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/")
    }

    const activities = await getActivities(session.user.id)

    const totalDistance = activities.reduce((acc, curr) => acc + curr.distanceM, 0) / 1000
    const totalRuns = activities.length

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

            <DashboardContent activities={activities} />
        </div>
    )
}
