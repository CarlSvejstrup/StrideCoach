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

async function getActivities(userId: string) {
    return await prisma.activity.findMany({
        where: { userId },
        orderBy: { startTime: 'desc' },
    })
}

function calculatePace(seconds: number, meters: number) {
    if (meters === 0) return "0:00"
    const paceSeconds = seconds / (meters / 1000)
    const minutes = Math.floor(paceSeconds / 60)
    const secs = Math.floor(paceSeconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60

    if (h > 0) return `${h}h ${m}m`
    return `${m}m ${s}s`
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

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                        <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRuns}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalDistance.toFixed(1)} km</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Last Run</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {activities[0] ? format(activities[0].startTime, 'MMM d') : '-'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {activities[0] ? `${(activities[0].distanceM / 1000).toFixed(1)} km` : ''}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Distance</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Pace</TableHead>
                                <TableHead>Avg HR</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {activities.map((activity) => (
                                <TableRow key={activity.id}>
                                    <TableCell className="font-medium">
                                        {format(activity.startTime, "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell>{activity.name}</TableCell>
                                    <TableCell>{(activity.distanceM / 1000).toFixed(2)} km</TableCell>
                                    <TableCell>{formatDuration(activity.movingS)}</TableCell>
                                    <TableCell>{calculatePace(activity.movingS, activity.distanceM)} /km</TableCell>
                                    <TableCell>{activity.averageHr ? Math.round(activity.averageHr) : '-'}</TableCell>
                                </TableRow>
                            ))}
                            {activities.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No activities found. <Link href="/import" className="underline">Import from Strava</Link>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
