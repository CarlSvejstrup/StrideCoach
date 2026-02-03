import { auth, signIn } from "@/auth"

export const dynamic = 'force-dynamic'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SyncButton } from "./sync-button"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { ProgramUploader } from "@/components/program-uploader"

export default async function ImportPage() {
    const session = await auth()

    return (
        <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle>Import Activities</CardTitle>
                    <CardDescription>
                        Connect your Strava account to start analyzing your runs.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    {!session ? (
                        <form
                            action={async () => {
                                "use server"
                                await signIn("strava", { redirectTo: "/import" })
                            }}
                            className="w-full"
                        >
                            <Button className="w-full bg-[#FC4C02] hover:bg-[#E34402] text-white">
                                Connect with Strava
                            </Button>
                        </form>
                    ) : (
                        <>
                            <div className="text-center space-y-2">
                                <p className="text-sm font-medium">
                                    Connected as <span className="text-primary">{session.user?.name}</span>
                                </p>
                                <SyncButton />
                                <div className="w-full pt-4">
                                    <ProgramUploader />
                                </div>
                            </div>

                            <div className="relative w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Next Steps
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 w-full">
                                <Link href="/chat" className="w-full">
                                    <Button variant="default" className="w-full">
                                        Go to Chat <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href="/dashboard" className="w-full">
                                    <Button variant="outline" className="w-full">
                                        View Dashboard
                                    </Button>
                                </Link>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
