import { cookies } from "next/headers"
import { supabase } from "@/lib/supabase"
import ChatClient from "@/components/chat-client"

export default async function ChatPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("zuzu_user_id")?.value

  let profile = null

  if (userId) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    profile = data
  }

  return <ChatClient profile={profile} />
}