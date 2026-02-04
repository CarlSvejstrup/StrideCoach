'use client'

import { useState, useMemo, useEffect, Fragment } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { format } from "date-fns"
import { calculatePace, formatDuration } from "@/lib/utils"
import { Activity } from "@prisma/client"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts'
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ElevationStats } from "@/components/elevation-stats"
import ReactMarkdown from "react-markdown"
import { computeCoachMetrics, scoreLabel, type CoachMetrics, getLoadType } from "@/lib/coach-metrics"
import { Loader2 } from "lucide-react"

interface DashboardContentProps {
    activities: Activity[]
}

type CoachInsight = {
    headline: string
    summary: string
    evidence: string[]
    takeaways: string[]
    nextStep: string
    progressNote: string
    flags: string[]
    planCompliance: {
        score: number
        note: string
    }
}

export function DashboardContent({ activities }: DashboardContentProps) {
    const [filter, setFilter] = useState<'all' | 'Run' | 'Ride' | 'Hike' | 'Walk' | 'Other'>('all')
    const [insightState, setInsightState] = useState<{
        status: 'idle' | 'loading' | 'ready' | 'error'
        insight?: CoachInsight
        metrics?: CoachMetrics
        error?: string
    }>({ status: 'idle' })
    const [openExplainId, setOpenExplainId] = useState<string | null>(null)
    const [explanations, setExplanations] = useState<Record<string, { status: 'idle' | 'loading' | 'ready' | 'error'; text?: string }>>({})

    const fallbackMetrics = useMemo(() => computeCoachMetrics(activities), [activities])
    const metrics = insightState.metrics ?? fallbackMetrics

    const filteredActivities = useMemo(() => {
        if (filter === 'all') return activities
        if (filter === 'Hike') return activities.filter(a => a.type === 'Hike')
        if (filter === 'Walk') return activities.filter(a => a.type === 'Walk')
        if (filter === 'Other') {
            return activities.filter(a => a.type !== 'Run' && a.type !== 'Ride' && a.type !== 'Hike' && a.type !== 'Walk')
        }
        return activities.filter(a => a.type === filter)
    }, [activities, filter])

    useEffect(() => {
        let isMounted = true
        const loadInsight = async () => {
            setInsightState({ status: 'loading' })
            try {
                const response = await fetch('/api/coach/insight', { method: 'POST' })
                if (!response.ok) {
                    throw new Error('Failed to load insight')
                }
                const data = await response.json()
                if (isMounted) {
                    setInsightState({ status: 'ready', insight: data.insight, metrics: data.metrics })
                }
            } catch (error) {
                console.error(error)
                if (isMounted) {
                    setInsightState({ status: 'error', error: 'Unable to generate coach insight right now.' })
                }
            }
        }

        loadInsight()
        return () => {
            isMounted = false
        }
    }, [])

    const paceData = metrics.runPaceTrend

    const handleExplain = async (activity: Activity) => {
        if (openExplainId === activity.id) {
            setOpenExplainId(null)
            return
        }

        setOpenExplainId(activity.id)
        if (explanations[activity.id]?.status === 'ready') {
            return
        }

        setExplanations((prev) => ({
            ...prev,
            [activity.id]: { status: 'loading' }
        }))

        try {
            const response = await fetch('/api/coach/explain-run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activityId: activity.id })
            })
            if (!response.ok) {
                throw new Error('Explain request failed')
            }
            const data = await response.json()
            setExplanations((prev) => ({
                ...prev,
                [activity.id]: { status: 'ready', text: data.explanation }
            }))
        } catch (error) {
            console.error(error)
            setExplanations((prev) => ({
                ...prev,
                [activity.id]: { status: 'error', text: 'Unable to generate explanation right now.' }
            }))
        }
    }

    const insight = insightState.insight

    return (
        <div className="space-y-8">
            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
                    <CardHeader>
                        <CardTitle className="text-base uppercase tracking-wide text-primary">AI Coach Insight — Today</CardTitle>
                        <CardDescription>Interpretation of your recent training load and recovery.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {insightState.status === 'loading' && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating coach insight...
                            </div>
                        )}
                        {insightState.status === 'error' && (
                            <p className="text-sm text-destructive">{insightState.error}</p>
                        )}
                        {insight && (
                            <>
                                <div>
                                    <p className="text-lg font-semibold">{insight.headline}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{insight.summary}</p>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold uppercase text-muted-foreground">Evidence</p>
                                        <ul className="list-disc pl-4 text-sm space-y-1">
                                            {insight.evidence.map((item, idx) => (
                                                <li key={`evidence-${idx}`}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold uppercase text-muted-foreground">Coaching takeaways</p>
                                        <ul className="list-disc pl-4 text-sm space-y-1">
                                            {insight.takeaways.map((item, idx) => (
                                                <li key={`takeaway-${idx}`}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <div className="rounded-lg border border-border/60 bg-background/70 p-3 text-sm">
                                    <p className="font-semibold">Next step</p>
                                    <p className="text-muted-foreground">{insight.nextStep}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-card/60">
                    <CardHeader>
                        <CardTitle>Coach Signals</CardTitle>
                        <CardDescription>Progress, compliance, and key flags.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-xs uppercase text-muted-foreground">Progress</p>
                            <p className="text-sm font-semibold">{insight?.progressNote || 'Calculating trend from recent runs.'}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-muted-foreground">Plan compliance</p>
                            <p className="text-sm font-semibold">{insight?.planCompliance.note || 'No plan signal yet.'}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase text-muted-foreground">Flags</p>
                            {insight?.flags?.length ? (
                                <ul className="list-disc pl-4 text-sm space-y-1">
                                    {insight.flags.map((flag, idx) => (
                                        <li key={`flag-${idx}`}>{flag}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">No red flags detected.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <ElevationStats activities={activities} />

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Training Load</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.load7} pts</div>
                        <p className="text-xs text-muted-foreground">{scoreLabel(metrics.trainingLoadScore)} vs baseline</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Fatigue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.fatigueScore}</div>
                        <p className="text-xs text-muted-foreground">Acute/chronic {metrics.acuteChronicRatio}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Plan Compliance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{insight?.planCompliance.score ?? 50}</div>
                        <p className="text-xs text-muted-foreground">{insight?.planCompliance.note || 'Awaiting plan context'}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Injury Risk</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.injuryRiskScore}</div>
                        <p className="text-xs text-muted-foreground">{scoreLabel(metrics.injuryRiskScore)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.progressScore}</div>
                        <p className="text-xs text-muted-foreground">{scoreLabel(metrics.progressScore)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Consistency</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.consistencyScore}</div>
                        <p className="text-xs text-muted-foreground">{metrics.activeDays14} active days (14d)</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Load Breakdown (last 7 days)</CardTitle>
                    <CardDescription>Separate stress by activity type.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-5">
                        {([
                            { label: 'Running', key: 'run' as const },
                            { label: 'Riding', key: 'ride' as const },
                            { label: 'Hiking', key: 'hike' as const },
                            { label: 'Walking', key: 'walk' as const },
                            { label: 'Other', key: 'other' as const }
                        ]).map((item) => (
                            <div key={item.key} className="rounded-lg border p-3">
                                <p className="text-xs uppercase text-muted-foreground">{item.label}</p>
                                <p className="text-xl font-semibold">{metrics.loadByType7[item.key]} pts</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1 border-none shadow-md bg-card/50 backdrop-blur">
                    <CardHeader>
                        <CardTitle>Training Load Trend</CardTitle>
                        <CardDescription>Last 14 days load by type</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.dailyLoad14}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                    itemStyle={{ color: 'hsl(var(--primary))' }}
                                />
                                <Bar dataKey="run" stackId="load" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="hike" stackId="load" fill="hsl(var(--primary) / 0.5)" />
                                <Bar dataKey="walk" stackId="load" fill="hsl(var(--secondary))" />
                                <Bar dataKey="ride" stackId="load" fill="hsl(var(--accent))" />
                                <Bar dataKey="other" stackId="load" fill="hsl(var(--muted))" />
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
                                    formatter={(value) => {
                                        const numeric = typeof value === 'number' ? value : Number(value)
                                        if (!Number.isFinite(numeric)) return [value, 'Pace']
                                        return [`${Math.floor(numeric)}:${Math.round((numeric % 1) * 60).toString().padStart(2, '0')} /km`, 'Pace']
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
                                <TableHead>Elev</TableHead>
                                <TableHead>Avg HR</TableHead>
                                <TableHead>Coach</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredActivities.map((activity) => {
                                const isExplainable = getLoadType(activity.type) === 'run'
                                const explainState = explanations[activity.id]

                                return (
                                    <Fragment key={activity.id}>
                                        <TableRow>
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
                                            <TableCell>{activity.totalElevationGain ? Math.round(activity.totalElevationGain) + 'm' : '-'}</TableCell>
                                            <TableCell>{activity.averageHr ? Math.round(activity.averageHr) : '-'}</TableCell>
                                            <TableCell>
                                                {isExplainable ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleExplain(activity)}
                                                        className="text-xs"
                                                    >
                                                        {openExplainId === activity.id ? 'Hide' : 'Explain'}
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                        {openExplainId === activity.id && (
                                            <TableRow>
                                                <TableCell colSpan={9} className="bg-muted/30">
                                                    {explainState?.status === 'loading' && (
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Generating coach explanation...
                                                        </div>
                                                    )}
                                                    {explainState?.status === 'error' && (
                                                        <p className="text-sm text-destructive">{explainState.text}</p>
                                                    )}
                                                    {explainState?.status === 'ready' && explainState.text && (
                                                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap break-words">
                                                            <ReactMarkdown>{explainState.text}</ReactMarkdown>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                )
                            })}
                            {filteredActivities.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
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
