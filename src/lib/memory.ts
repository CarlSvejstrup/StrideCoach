import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const MEMORY_FILE = path.join(DATA_DIR, 'memory.md')
const TRAINING_PLAN_FILE = path.join(DATA_DIR, 'training_plan.md')

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
    // Append to memory, or overwrite? 
    // For simplicity, let's treat memory.md as a growing list of facts.
    // If we want to strictly append, we should read first or use appendFile.
    // However, if the model wants to "rewrite" memory, overwrite is better.
    // Let's assume the input is the NEW memory item to append.

    // Actually, for better control, let's just append for now with a timestamp?
    // Or just append text.
    await fs.appendFile(MEMORY_FILE, `\n- ${content}`)
}

export async function getTrainingPlan(): Promise<string> {
    try {
        await ensureDataDir()
        return await fs.readFile(TRAINING_PLAN_FILE, 'utf-8')
    } catch (error) {
        return ""
    }
}

export async function saveTrainingPlan(content: string): Promise<void> {
    await ensureDataDir()
    await fs.writeFile(TRAINING_PLAN_FILE, content, 'utf-8')
}
