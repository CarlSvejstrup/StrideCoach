import fs from 'fs/promises'
import path from 'path'
import { prisma } from "@/lib/db"

const DATA_DIR = path.join(process.cwd(), 'data')
const MEMORY_FILE = path.join(DATA_DIR, 'memory.md')

async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR)
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true })
    }
}

export async function getMemory(): Promise<string> {
    try {
        await ensureDataDir()
        return await fs.readFile(MEMORY_FILE, 'utf-8')
    } catch (error) {
        return ""
    }
}

export async function saveMemory(content: string): Promise<void> {
    await ensureDataDir()
    await fs.appendFile(MEMORY_FILE, `\n- ${content}`)
}

export async function saveTrainingPlan(userId: string, content: string): Promise<void> {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { trainingProgram: content }
        })
    } catch (error) {
        console.error("Error saving training plan:", error)
        throw error
    }
}

export async function getTrainingPlan(userId: string): Promise<string> {
    try {
        // Fetch from DB
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { trainingProgram: true }
        })
        return user?.trainingProgram || ""
    } catch (error) {
        console.error("Error fetching training plan:", error)
        return ""
    }
}
