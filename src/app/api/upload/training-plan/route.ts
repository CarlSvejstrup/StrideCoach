import { auth } from "@/auth"
import { saveTrainingPlan } from "@/lib/memory"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return new NextResponse("No file provided", { status: 400 })
        }

        // Basic text extraction for .txt and .md
        // For .pdf, we would need a parser. For MVP, we'll try to read text.
        // If it's a binary file like PDF validation will fail or we just read garbled text without a lib.
        // I'll stick to text-based files for now as per plan constraints/simplicity.

        const text = await file.text()

        await saveTrainingPlan(session.user.id, text)

        return NextResponse.json({ success: true, message: "Training plan uploaded" })
    } catch (error) {
        console.error("Upload error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
