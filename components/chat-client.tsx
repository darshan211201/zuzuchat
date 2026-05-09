"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import VideoCall from "@/components/video-call"

type Profile = {
  id: string
  name: string
  username: string
}

type Message = {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  created_at: string
}

export default function ChatClient({ profile }: { profile: Profile | null }) {
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<Profile[]>([])
  const [friends, setFriends] = useState<Profile[]>([])
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")

  useEffect(() => {
    loadFriends()
  }, [profile])

  useEffect(() => {
    if (!profile || !selectedFriend) return

    loadMessages()

    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new as Message

          const isThisChat =
            (msg.sender_id === profile.id && msg.receiver_id === selectedFriend.id) ||
            (msg.sender_id === selectedFriend.id && msg.receiver_id === profile.id)

          if (isThisChat) {
            setMessages((prev) => [...prev, msg])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile, selectedFriend])

  async function loadFriends() {
    if (!profile) return

    const { data, error } = await supabase
      .from("friends")
      .select("friend_id")
      .eq("user_id", profile.id)

    if (error) {
      alert(error.message)
      return
    }

    const friendIds = data.map((item) => item.friend_id)

    if (friendIds.length === 0) {
      setFriends([])
      return
    }

    const { data: friendProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", friendIds)

    if (profileError) {
      alert(profileError.message)
      return
    }

    setFriends(friendProfiles || [])
  }

  async function searchUsers(value: string) {
    setSearch(value)

    if (!value.trim()) {
      setResults([])
      return
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${value}%`)
      .neq("id", profile?.id || "")

    if (error) {
      alert(error.message)
      return
    }

    setResults(data || [])
  }

  async function addFriend(friendId: string) {
    if (!profile) {
      alert("Profile not found")
      return
    }

    const { error } = await supabase.from("friends").insert({
      user_id: profile.id,
      friend_id: friendId,
    })

    if (error) {
      alert(error.message)
      return
    }

    alert("Friend added ✅")
    setSearch("")
    setResults([])
    loadFriends()
  }

  async function loadMessages() {
    if (!profile || !selectedFriend) return

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${profile.id},receiver_id.eq.${selectedFriend.id}),and(sender_id.eq.${selectedFriend.id},receiver_id.eq.${profile.id})`
      )
      .order("created_at", { ascending: true })

    if (error) {
      alert(error.message)
      return
    }

    setMessages(data || [])
  }

  async function sendMessage() {
    if (!profile || !selectedFriend || !newMessage.trim()) return

    const { error } = await supabase.from("messages").insert({
      sender_id: profile.id,
      receiver_id: selectedFriend.id,
      message: newMessage.trim(),
    })

    if (error) {
      alert(error.message)
      return
    }

    setNewMessage("")
  }

  return (
    <div className="h-screen bg-black text-white flex">
      <div className="w-80 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-blue-400">ZuzuChat</h1>
          <p className="text-slate-400 text-sm mt-1">
            @{profile?.username || "no-profile"}
          </p>
        </div>

        <div className="p-4">
          <input
            value={search}
            onChange={(e) => searchUsers(e.target.value)}
            placeholder="Search username..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"
          />
        </div>

        {results.length > 0 && (
          <div className="p-3 space-y-2 border-b border-slate-800">
            {results.map((user) => (
              <div
                key={user.id}
                className="bg-slate-900 rounded-xl p-3 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold">{user.name}</h3>
                  <p className="text-sm text-slate-400">@{user.username}</p>
                </div>

                <button
                  onClick={() => addFriend(user.id)}
                  className="bg-blue-700 hover:bg-blue-600 px-3 py-2 rounded-lg"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <p className="text-xs text-slate-500 px-2 mb-2">Friends</p>

          {friends.map((friend) => (
            <button
              key={friend.id}
              onClick={() => setSelectedFriend(friend)}
              className={`w-full text-left rounded-xl p-4 ${
                selectedFriend?.id === friend.id
                  ? "bg-blue-900/40 border border-blue-800"
                  : "bg-slate-900"
              }`}
            >
              <h3 className="font-semibold">{friend.name}</h3>
              <p className="text-sm text-slate-400">@{friend.username}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-950 to-black">
        {selectedFriend ? (
          <>
            <div className="h-20 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-950">
              <div>
                <h2 className="font-bold text-xl">{selectedFriend.name}</h2>
                <p className="text-slate-400 text-sm">@{selectedFriend.username}</p>
              </div>

              <div className="flex gap-3">
                <button className="bg-slate-800 px-4 py-2 rounded-lg">📞</button>
                <VideoCall profile={profile} selectedFriend={selectedFriend} />
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender_id === profile?.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl max-w-md ${
                      msg.sender_id === profile?.id
                        ? "bg-blue-700"
                        : "bg-slate-800"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950 flex gap-3">
              <button className="bg-slate-800 px-4 rounded-xl">😊</button>

              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage()
                }}
                placeholder="Type a message..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"
              />

              <button
                onClick={sendMessage}
                className="bg-blue-700 hover:bg-blue-600 px-6 rounded-xl"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <h1 className="text-3xl text-slate-400">
              Select a friend to chat 🚀
            </h1>
          </div>
        )}
      </div>
    </div>
  )
}