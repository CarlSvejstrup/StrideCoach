import { auth } from "@/auth"
import { redirect } from "next/navigation"
import ChatClient from "./chat-client"

export default async function ChatPage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/import")
    }

    return <ChatClient />
}
