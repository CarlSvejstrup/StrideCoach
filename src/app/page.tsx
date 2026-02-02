import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, MessageSquare, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Activity className="h-6 w-6" />
              <span className="hidden font-bold sm:inline-block">
                StrideCoach
              </span>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              Talk to your runs. <br className="hidden sm:inline" />
              Train with insight.
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Import your Strava history and chat with an AI coach that knows every split, heart rate spike, and elevation gain.
            </p>
            <div className="space-x-4">
              <Link href="/import">
                <Button size="lg" className="h-11 px-8">
                  Get Started
                </Button>
              </Link>
              <Link href="https://github.com/CarlSvejstrup/StrideCoach" target="_blank" rel="noreferrer">
                <Button variant="outline" size="lg" className="h-11 px-8">
                  GitHub
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Feature Grid */}
        <section className="container space-y-6 py-8 dark:bg-transparent md:py-12 lg:py-24">
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
             <Card>
                <CardHeader>
                  <Activity className="h-10 w-10 text-primary mb-2"/>
                  <CardTitle>Sync Activities</CardTitle>
                  <CardDescription>
                    Automatically import your recent runs from Strava.
                  </CardDescription>
                </CardHeader>
             </Card>
             <Card>
                <CardHeader>
                   <MessageSquare className="h-10 w-10 text-primary mb-2"/>
                   <CardTitle>AI Coach</CardTitle>
                   <CardDescription>
                     Ask questions like "Why was my HR high on Tuesday?"
                   </CardDescription>
                </CardHeader>
             </Card>
             <Card>
                <CardHeader>
                   <TrendingUp className="h-10 w-10 text-primary mb-2"/>
                   <CardTitle>Deep Analysis</CardTitle>
                   <CardDescription>
                     Get insights on pace, elevation, and performance trends.
                   </CardDescription>
                </CardHeader>
             </Card>
          </div>
        </section>
      </main>
    </div>
  )
}
