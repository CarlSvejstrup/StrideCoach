import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity } from "@prisma/client"
import { useMemo } from "react"
import { Mountain } from "lucide-react"
import { getISOWeek, getYear, getMonth, isSameYear } from "date-fns"

interface ElevationStatsProps {
    activities: Activity[]
}

export function ElevationStats({ activities }: ElevationStatsProps) {
    const stats = useMemo(() => {
        const now = new Date()
        const currentYear = getYear(now)
        const currentMonth = getMonth(now)
        const currentWeek = getISOWeek(now)

        let weeklyGain = 0
        let monthlyGain = 0
        let yearlyGain = 0

        activities.forEach(activity => {
            const date = new Date(activity.startTime)
            const year = getYear(date)
            const gain = activity.totalElevationGain || 0

            // Only count Run/Hike/Walk for elevation generally, or just everything? 
            // Usually desired for runs/hikes.
            if (['Run', 'TrailRun', 'Hike', 'Walk'].includes(activity.type)) {
                if (year === currentYear) {
                    yearlyGain += gain

                    if (getMonth(date) === currentMonth) {
                        monthlyGain += gain
                    }

                    if (getISOWeek(date) === currentWeek) {
                        weeklyGain += gain
                    }
                }
            }
        })

        return { weeklyGain, monthlyGain, yearlyGain }
    }, [activities])

    return (
        <Card className="border-none shadow-md bg-gradient-to-br from-indigo-50/50 to-slate-50/50 dark:from-indigo-950/20 dark:to-slate-900/20 backdrop-blur-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Mountain className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Elevation Gain</CardTitle>
                        <CardDescription>Vertical meters run & hiked</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">This Week</p>
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {Math.round(stats.weeklyGain).toLocaleString()}
                            <span className="text-xs font-normal text-muted-foreground ml-1">m</span>
                        </div>
                    </div>
                    <div className="space-y-1 border-l border-r border-border/50">
                        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">This Month</p>
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {Math.round(stats.monthlyGain).toLocaleString()}
                            <span className="text-xs font-normal text-muted-foreground ml-1">m</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">This Year</p>
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {Math.round(stats.yearlyGain).toLocaleString()}
                            <span className="text-xs font-normal text-muted-foreground ml-1">m</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
