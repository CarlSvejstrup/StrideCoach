'use client'

import { useState, useMemo } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, subDays } from "date-fns"
import { calculatePace, formatDuration } from "@/lib/utils"
import { Activity } from "@prisma/client"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts'
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DashboardContentProps {
    activities: Activity[]
}

export function DashboardContent({ activities }: DashboardContentProps) {
    const [filter, setFilter] = useState<'all' | 'Run' | 'Ride' | 'Other'>('all')

    const filteredActivities = useMemo(() => {
        if (filter === 'all') return activities
        if (filter === 'Other') {
            return activities.filter(a => a.type !== 'Run' && a.type !== 'Ride')
        }
        return activities.filter(a => a.type === filter)
    }, [activities, filter])

    const chartData = useMemo(() => {
        // Last 14 days distance
        const data = []
        for (let i = 13; i >= 0; i--) {
            const date = subDays(new Date(), i)
            const dateStr = format(date, 'yyyy-MM-dd')
            const dayDistance = activities
                .filter(a => format(new Date(a.startTime), 'yyyy-MM-dd') === dateStr)
                .reduce((acc, curr) => acc + curr.distanceM, 0) / 1000

            data.push({
                date: format(date, 'MMM d'),
                distance: parseFloat(dayDistance.toFixed(2))
            })
        }
        return data
    }, [activities])

    const weeklyStats = useMemo(() => {
        const start = startOfWeek(new Date())
        const end = endOfWeek(new Date())
        const thisWeek = activities.filter(a =>
            isWithinInterval(new Date(a.startTime), { start, end })
        )
        const distance = thisWeek.reduce((acc, curr) => acc + curr.distanceM, 0) / 1000
        return {
            distance: distance.toFixed(1),
            count: thisWeek.length
        }
    }, [activities])

    const monthlyStats = useMemo(() => {
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const thisMonth = activities.filter(a => new Date(a.startTime) >= monthStart)
        const distance = thisMonth.reduce((acc, curr) => acc + curr.distanceM, 0) / 1000
        return {
            distance: distance.toFixed(1),
            count: thisMonth.length
        }
    }, [activities])

    const totalStats = useMemo(() => {
        const distance = activities.reduce((acc, curr) => acc + curr.distanceM, 0) / 1000
        const totalSeconds = activities.reduce((acc, curr) => acc + curr.movingS, 0)
        const avgPace = calculatePace(totalSeconds, activities.reduce((acc, curr) => acc + curr.distanceM, 0))
        return {
            distance: distance.toFixed(0),
            count: activities.length,
            avgPace
        }
    }, [activities])

    const paceData = useMemo(() => {
        // Last 10 runs pace
        return activities
            .filter(a => a.type === 'Run')
            .slice(0, 10)
            .reverse()
            .map(a => {
                const paceMin = a.movingS / (a.distanceM / 1000) / 60
                return {
                    date: format(new Date(a.startTime), 'MMM d'),
                    pace: parseFloat(paceMin.toFixed(2)),
                    rawPace: calculatePace(a.movingS, a.distanceM)
                }
            })
    }, [activities])

    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Weekly Distance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{weeklyStats.distance} km</div>
                        <p className="text-xs text-muted-foreground">{weeklyStats.count} activities this week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{monthlyStats.distance} km</div>
                        <p className="text-xs text-muted-foreground">{monthlyStats.count} activities</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">All Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalStats.distance} km</div>
                        <p className="text-xs text-muted-foreground">{totalStats.count} total activities</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Pace</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalStats.avgPace} /km</div>
                        <p className="text-xs text-muted-foreground">Lifetime average</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1 border-none shadow-md bg-card/50 backdrop-blur">
                    <CardHeader>
                        <CardTitle>Distance Trend</CardTitle>
                        <CardDescription>Last 14 days distance (km)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}km`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                    itemStyle={{ color: 'hsl(var(--primary))' }}
                                />
                                <Bar dataKey="distance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-1 border-none shadow-md bg-card/50 backdrop-blur">
                    <CardHeader>
                        <CardTitle>Pace Progress</CardTitle>
                        <CardDescription>Pace (min/km) for last 10 runs</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={paceData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis
                                    reversed
                                    domain={['dataMin - 0.5', 'dataMax + 0.5']}
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `${Math.floor(val)}:${Math.round((val % 1) * 60).toString().padStart(2, '0')}`}
                                />
                                <Tooltip
                                    formatter={(value: any) => {
                                        if (typeof value !== 'number') return [value, 'Pace'];
                                        return [`${Math.floor(value)}:${Math.round((value % 1) * 60).toString().padStart(2, '0')} /km`, 'Pace'];
                                    }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="pace"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={3}
                                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Activities</CardTitle>
                        <CardDescription>View and filter your synced data</CardDescription>
                    </div>
                    <div className="flex bg-muted p-1 rounded-lg gap-1">
                        {(['all', 'Run', 'Ride', 'Other'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilter(t)}
                                className={cn(
                                    "px-3 py-1 text-sm font-medium rounded-md transition-all",
                                    filter === t
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {t === 'all' ? 'All' : t + 's'}
                            </button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Distance</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead>Pace</TableHead>
                                <TableHead>Avg HR</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredActivities.map((activity) => (
                                <TableRow key={activity.id}>
                                    <TableCell className="font-medium">
                                        {format(new Date(activity.startTime), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{activity.type}</Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">{activity.name}</TableCell>
                                    <TableCell>{(activity.distanceM / 1000).toFixed(2)} km</TableCell>
                                    <TableCell>{formatDuration(activity.movingS)}</TableCell>
                                    <TableCell>{calculatePace(activity.movingS, activity.distanceM)} /km</TableCell>
                                    <TableCell>{activity.averageHr ? Math.round(activity.averageHr) : '-'}</TableCell>
                                </TableRow>
                            ))}
                            {filteredActivities.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        No matching activities found.
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
