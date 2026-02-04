import { format, subDays, isAfter } from "date-fns"

export type ActivityLike = {
    type: string
    startTime: Date | string
    distanceM: number
    movingS: number
    averageHr?: number | null
    name?: string | null
}

export type LoadType = 'run' | 'ride' | 'hike' | 'walk' | 'other'

export type DailyLoadPoint = {
    date: string
    run: number
    ride: number
    hike: number
    walk: number
    other: number
    total: number
}

export type CoachMetrics = {
    asOf: string
    load7: number
    load28: number
    loadByType7: Record<LoadType, number>
    dailyLoad14: DailyLoadPoint[]
    runPaceTrend: Array<{ date: string; pace: number; paceLabel: string }>
    acuteChronicRatio: number
    fatigueScore: number
    injuryRiskScore: number
    consistencyScore: number
    progressScore: number
    trainingLoadScore: number
    runDays7: number
    activeDays14: number
}

const RUN_TYPES = new Set(['Run', 'TrailRun', 'VirtualRun'])
const RIDE_TYPES = new Set(['Ride', 'VirtualRide', 'EBikeRide'])
const HIKE_TYPES = new Set(['Hike'])
const WALK_TYPES = new Set(['Walk'])

const TYPE_WEIGHTS: Record<LoadType, number> = {
    run: 1.0,
    ride: 0.6,
    hike: 0.85,
    walk: 0.5,
    other: 0.45
}

export function getLoadType(activityType: string): LoadType {
    if (RUN_TYPES.has(activityType)) return 'run'
    if (RIDE_TYPES.has(activityType)) return 'ride'
    if (HIKE_TYPES.has(activityType)) return 'hike'
    if (WALK_TYPES.has(activityType)) return 'walk'
    return 'other'
}

export function calculateActivityLoad(activity: ActivityLike): { load: number; type: LoadType; paceMinKm: number | null } {
    const type = getLoadType(activity.type)
    const durationMin = activity.movingS / 60
    if (!Number.isFinite(durationMin) || durationMin <= 0) {
        return { load: 0, type, paceMinKm: null }
    }

    const distanceKm = activity.distanceM / 1000
    const paceMinKm = distanceKm > 0 ? durationMin / distanceKm : null

    let intensity = 1
    if (type === 'run' && paceMinKm) {
        if (paceMinKm < 4.5) intensity = 1.25
        else if (paceMinKm < 5.5) intensity = 1.15
        else if (paceMinKm > 7.5) intensity = 0.9
    }
    if (type === 'hike' && paceMinKm) {
        intensity = 1.05
    }

    const load = durationMin * TYPE_WEIGHTS[type] * intensity
    return { load, type, paceMinKm }
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value))
}

function normalizeDate(value: Date | string) {
    return value instanceof Date ? value : new Date(value)
}

export function computeCoachMetrics(activities: ActivityLike[], asOf = new Date()): CoachMetrics {
    const now = asOf
    const loadByType7: Record<LoadType, number> = {
        run: 0,
        ride: 0,
        hike: 0,
        walk: 0,
        other: 0
    }
    let load7 = 0
    let load28 = 0
    const dailyLoad14: DailyLoadPoint[] = []
    const dailyLoadMap = new Map<string, DailyLoadPoint>()

    for (let i = 13; i >= 0; i--) {
        const date = subDays(now, i)
        const key = format(date, 'yyyy-MM-dd')
        const point: DailyLoadPoint = { date: format(date, 'MMM d'), run: 0, ride: 0, hike: 0, walk: 0, other: 0, total: 0 }
        dailyLoad14.push(point)
        dailyLoadMap.set(key, point)
    }

    const last7Start = subDays(now, 7)
    const last28Start = subDays(now, 28)
    const last14Start = subDays(now, 14)

    const activeDays14 = new Set<string>()
    const runDays7 = new Set<string>()
    const recentRuns: ActivityLike[] = []
    const priorRuns: ActivityLike[] = []

    for (const activity of activities) {
        const activityDate = normalizeDate(activity.startTime)
        const { load, type, paceMinKm } = calculateActivityLoad(activity)
        const dateKey = format(activityDate, 'yyyy-MM-dd')

        if (isAfter(activityDate, last14Start)) {
            activeDays14.add(dateKey)
        }

        if (isAfter(activityDate, last7Start)) {
            load7 += load
            loadByType7[type] += load
            if (type === 'run') runDays7.add(dateKey)
        }

        if (isAfter(activityDate, last28Start)) {
            load28 += load
        }

        const dailyPoint = dailyLoadMap.get(dateKey)
        if (dailyPoint) {
            dailyPoint[type] += load
            dailyPoint.total += load
        }

        if (type === 'run' && paceMinKm) {
            if (isAfter(activityDate, last14Start)) {
                recentRuns.push(activity)
            } else if (isAfter(activityDate, last28Start)) {
                priorRuns.push(activity)
            }
        }
    }

    const runPaceTrend = activities
        .filter((activity) => getLoadType(activity.type) === 'run' && activity.distanceM > 0)
        .slice(0, 10)
        .reverse()
        .map((activity) => {
            const paceMin = activity.movingS / (activity.distanceM / 1000) / 60
            const paceLabel = `${Math.floor(paceMin)}:${Math.round((paceMin % 1) * 60).toString().padStart(2, '0')}`
            return {
                date: format(normalizeDate(activity.startTime), 'MMM d'),
                pace: parseFloat(paceMin.toFixed(2)),
                paceLabel
            }
        })

    const acuteChronicRatio = load28 > 0 ? load7 / (load28 / 4) : 0
    const fatigueScore = clamp(Math.round(50 + (acuteChronicRatio - 1) * 45), 0, 100)
    const trainingLoadScore = clamp(Math.round(50 + (acuteChronicRatio - 1) * 55), 0, 100)

    const runDaysCount = runDays7.size
    const injuryRiskBase = 50 + (acuteChronicRatio - 1) * 60
    const injuryRiskScore = clamp(Math.round(injuryRiskBase + (runDaysCount >= 5 ? 10 : 0)), 0, 100)

    const consistencyScore = clamp(Math.round((activeDays14.size / 14) * 100), 0, 100)

    const avgPace = (runs: ActivityLike[]) => {
        const totalDistance = runs.reduce((acc, run) => acc + run.distanceM, 0)
        const totalTime = runs.reduce((acc, run) => acc + run.movingS, 0)
        if (totalDistance <= 0) return null
        return totalTime / (totalDistance / 1000)
    }

    const recentAvgPace = avgPace(recentRuns)
    const priorAvgPace = avgPace(priorRuns)
    let progressScore = 50
    if (recentAvgPace && priorAvgPace) {
        const improvement = (priorAvgPace - recentAvgPace) / priorAvgPace
        progressScore = clamp(Math.round(50 + improvement * 200), 0, 100)
    }

    return {
        asOf: now.toISOString(),
        load7: Math.round(load7),
        load28: Math.round(load28),
        loadByType7: {
            run: Math.round(loadByType7.run),
            ride: Math.round(loadByType7.ride),
            hike: Math.round(loadByType7.hike),
            walk: Math.round(loadByType7.walk),
            other: Math.round(loadByType7.other)
        },
        dailyLoad14,
        runPaceTrend,
        acuteChronicRatio: Number(acuteChronicRatio.toFixed(2)),
        fatigueScore,
        injuryRiskScore,
        consistencyScore,
        progressScore,
        trainingLoadScore,
        runDays7: runDaysCount,
        activeDays14: activeDays14.size
    }
}

export function scoreLabel(score: number) {
    if (score >= 80) return 'High'
    if (score >= 60) return 'Moderate'
    if (score >= 40) return 'Low'
    return 'Very Low'
}
