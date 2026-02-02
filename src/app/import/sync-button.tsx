'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { importActivities } from "@/actions/strava"
import { Loader2, RefreshCw } from "lucide-react"

export function SyncButton() {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

    const handleSync = async () => {
        setLoading(true)
        setMessage("")
        try {
            const result = await importActivities()
            if (result.success) {
                setMessage(`Success! Imported ${result.count} activities.`)
            }
        } catch (err) {
            console.error(err)
            setMessage("Failed to sync. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <Button
                onClick={handleSync}
                disabled={loading}
                size="lg"
                className="w-full sm:w-auto"
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                    </>
                ) : (
                    <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync Recent Activities
                    </>
                )}
            </Button>
            {message && (
                <p className="text-sm text-muted-foreground animate-in fade-in slide-in-from-top-1">
                    {message}
                </p>
            )}
        </div>
    )
}
