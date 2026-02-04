"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { uploadTrainingProgram } from "@/actions/program"

export function ProgramUploader() {
    const [isUploading, setIsUploading] = useState(false)
    const [fileName, setFileName] = useState<string | null>(null)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.endsWith('.md') && !file.name.endsWith('.json')) {
            alert("Please upload a .md or .json file")
            return
        }

        setFileName(file.name)
        setIsUploading(true)
        setStatus('idle')

        try {
            const text = await file.text()
            const result = await uploadTrainingProgram(text)
            if (result.success) {
                setStatus('success')
            } else {
                setStatus('error')
            }
        } catch (error) {
            console.error(error)
            setStatus('error')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Upload Training Program</CardTitle>
                <CardDescription>
                    Upload a markdown (.md) or JSON (.json) file containing your training schedule.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <label
                            htmlFor="program-upload"
                            className="flex items-center justify-center w-full h-32 px-4 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary/50 focus:outline-none"
                        >
                            <div className="flex flex-col items-center space-y-2">
                                {status === 'success' ? (
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                ) : status === 'error' ? (
                                    <AlertCircle className="w-8 h-8 text-destructive" />
                                ) : (
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                )}
                                <span className="font-medium text-muted-foreground text-sm">
                                    {fileName || "Click to upload .md or .json file"}
                                </span>
                            </div>
                            <input
                                id="program-upload"
                                type="file"
                                className="hidden"
                                accept=".md,.json"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
