'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function uploadTrainingProgram(content: string) {
    const session = await auth()
    if (!session?.user?.id) {
        throw new Error("Not authenticated")
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                trainingProgram: content
            }
        })

        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        console.error("Failed to upload training program:", error)
        return { success: false, error: "Failed to save program" }
    }
}
