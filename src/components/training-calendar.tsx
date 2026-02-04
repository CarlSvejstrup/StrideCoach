"use client"

import { useState } from "react"
import { WeeklyPlan, DayPlan } from "@/lib/training-parser"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Activity, Moon, Dumbbell } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import ReactMarkdown from 'react-markdown'

interface TrainingCalendarProps {
    weeks: WeeklyPlan[]
    initialWeekIndex?: number
}

export function TrainingCalendar({ weeks, initialWeekIndex = 0 }: TrainingCalendarProps) {
    const [currentWeekIndex, setCurrentWeekIndex] = useState(initialWeekIndex)
    // Default to Monday or the first day available
    const [selectedDay, setSelectedDay] = useState<string>('Monday')

    if (!weeks || weeks.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    <CalendarIcon className="w-10 h-10 mb-2 opacity-50" />
                    <p>No training plan active.</p>
                    <p className="text-sm">Upload a .md file in the Import tab to see your weekly schedule here.</p>
                </CardContent>
            </Card>
        )
    }

    const currentWeek = weeks[currentWeekIndex]

    const nextWeek = () => {
        if (currentWeekIndex < weeks.length - 1) {
            setCurrentWeekIndex(curr => curr + 1)
        }
    }

    const prevWeek = () => {
        if (currentWeekIndex > 0) {
            setCurrentWeekIndex(curr => curr - 1)
        }
    }

    const getActivityIcon = (type: DayPlan['type']) => {
        switch (type) {
            case 'run': return <Activity className="w-4 h-4" />
            case 'rest': return <Moon className="w-4 h-4" />
            case 'cross-train': return <Dumbbell className="w-4 h-4" />
            default: return <Activity className="w-4 h-4" />
        }
    }

    const getActivityColor = (type: DayPlan['type'], isActive: boolean) => {
        if (isActive) {
            switch (type) {
                case 'run': return "bg-orange-500 text-white ring-2 ring-orange-200 dark:ring-orange-900"
                case 'rest': return "bg-blue-500 text-white ring-2 ring-blue-200 dark:ring-blue-900"
                case 'cross-train': return "bg-purple-500 text-white ring-2 ring-purple-200 dark:ring-purple-900"
                default: return "bg-primary text-primary-foreground"
            }
        }

        // Inactive states
        switch (type) {
            case 'run': return "bg-orange-500/10 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20"
            case 'rest': return "bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20"
            case 'cross-train': return "bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-500/20"
            default: return "bg-muted text-muted-foreground hover:bg-muted/80"
        }
    }

    const selectedPlan = currentWeek.days.find(d => d.day === selectedDay) || {
        day: selectedDay || "",
        title: "Rest / No Plan",
        content: "",
        type: 'rest' as const
    }

    return (
        <div className="w-full space-y-4">
            {/* Header with Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                    <h2 className="text-xl font-semibold tracking-tight">{currentWeek.weekTitle}</h2>
                </div>

                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 border">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={prevWeek}
                        disabled={currentWeekIndex === 0}
                        className="h-7 w-7"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-mono w-[60px] text-center">
                        {currentWeekIndex + 1} / {weeks.length}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={nextWeek}
                        disabled={currentWeekIndex === weeks.length - 1}
                        className="h-7 w-7"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid - Day Selectors */}
            <div className="grid grid-cols-7 gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((dayName) => {
                    const dayPlan = currentWeek.days.find(d => d.day === dayName)
                    const type = dayPlan?.type || 'rest'
                    const isActive = selectedDay === dayName

                    return (
                        <button
                            key={dayName}
                            onClick={() => setSelectedDay(dayName)}
                            className={cn(
                                "flex flex-col items-center justify-center py-3 px-1 rounded-lg transition-all duration-200 border",
                                getActivityColor(type, isActive),
                                !isActive && "border-transparent opacity-80 hover:opacity-100 scale-95 hover:scale-100",
                                isActive && "transform scale-100 shadow-sm"
                            )}
                        >
                            <span className="text-[10px] uppercase font-bold tracking-wider mb-1 opacity-90">
                                {dayName.substring(0, 3)}
                            </span>
                            {getActivityIcon(type)}
                        </button>
                    )
                })}
            </div>

            {/* Detail View Panel */}
            <Card className="border-border shadow-sm bg-card/50 backdrop-blur-sm transition-all duration-300">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">
                                    {selectedPlan.day}
                                </CardTitle>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "font-normal text-xs uppercase tracking-wider",
                                        selectedPlan.type === 'run' ? "border-orange-500 text-orange-600 bg-orange-500/5" :
                                            selectedPlan.type === 'rest' ? "border-blue-500 text-blue-600 bg-blue-500/5" :
                                                selectedPlan.type === 'cross-train' ? "border-purple-500 text-purple-600 bg-purple-500/5" :
                                                    ""
                                    )}
                                >
                                    {selectedPlan.type}
                                </Badge>
                            </div>
                            <h3 className="text-base font-medium text-muted-foreground">{selectedPlan.title}</h3>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-2">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed">
                        {selectedPlan.content ? (
                            <ReactMarkdown
                                components={{
                                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                    strong: ({ node, ...props }) => <span className="font-semibold text-foreground" {...props} />
                                }}
                            >
                                {selectedPlan.content}
                            </ReactMarkdown>
                        ) : (
                            <div className="flex items-center gap-2 text-muted-foreground italic text-sm py-4">
                                <Moon className="w-4 h-4" />
                                <span>Rest day. No planned activities.</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
