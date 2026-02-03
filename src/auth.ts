import NextAuth from "next-auth"
import Strava from "next-auth/providers/strava"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
    debug: true,
    adapter: PrismaAdapter(prisma),
    providers: [
        Strava({
            clientId: process.env.STRAVA_CLIENT_ID,
            clientSecret: process.env.STRAVA_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: "read,activity:read,activity:read_all,profile:read_all",
                    approval_prompt: "force",
                },
            },
            profile(profile) {
                return {
                    id: profile.id.toString(),
                    name: `${profile.firstname} ${profile.lastname}`,
                    email: null,
                    image: profile.profile,
                }
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            console.log("------- DEBUG: STRAVA LOGIN -------")
            console.log("Account Data:", JSON.stringify(account, null, 2))
            console.log("-----------------------------------")
            return true
        },
        async session({ session, user }) {
            if (session.user && user) {
                session.user.id = user.id
            }
            return session
        },
    },

    pages: {
        signIn: '/import', // Redirect to import if not signed in (or keep default for now)
    }
})
