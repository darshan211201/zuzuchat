"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import VideoCall from "@/components/video-call"
import EmojiPicker, { Theme } from "emoji-picker-react"
import ProfileAvatar from "@/components/profile-avatar"
import ImageUpload from "@/components/image-upload"
import { encryptMessage, decryptMessage } from "@/lib/encryption"

type Profile = {
  id: string
  name: string
  username: string
  is_online?: boolean
  is_typing?: boolean
  avatar_url?: string | null
}

type Message = {
  id: string
  sender_id: string
  receiver_id: string
  message: string | null
  image_url?: string | null
  created_at: string
  is_seen?: boolean
}

export default function ChatClient({ profile }: { profile: Profile | null }) {
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<Profile[]>([])
  const [friends, setFriends] = useState<Profile[]>([])
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [showEmoji, setShowEmoji] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!profile) return

    async function goOnline() {
      await supabase
        .from("profiles")
        .update({ is_online: true, is_typing: false })
        .eq("id", profile!.id)
    }

    async function goOffline() {
      await supabase
        .from("profiles")
        .update({ is_online: false, is_typing: false })
        .eq("id", profile!.id)
    }

    goOnline()
    window.addEventListener("beforeunload", goOffline)

    return () => {
      goOffline()
      window.removeEventListener("beforeunload", goOffline)
    }
  }, [profile])

  useEffect(() => {
    loadFriends()
  }, [profile])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!profile || !selectedFriend) return

    loadMessages()
    markMessagesSeen()

    const msgChannel = supabase
      .channel(`messages-${profile.id}-${selectedFriend.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new as Message
          if (!msg) return

          const isThisChat =
            (msg.sender_id === profile.id && msg.receiver_id === selectedFriend.id) ||
            (msg.sender_id === selectedFriend.id && msg.receiver_id === profile.id)

          if (isThisChat) {
            loadMessages()
            markMessagesSeen()
          }
        }
      )
      .subscribe()

    const profileChannel = supabase
      .channel(`profile-${selectedFriend.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${selectedFriend.id}`,
        },
        (payload) => {
          setSelectedFriend(payload.new as Profile)
          loadFriends()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(profileChannel)
    }
  }, [profile, selectedFriend])

  async function loadFriends() {
    if (!profile) return

    const { data } = await supabase
      .from("friends")
      .select("friend_id")
      .eq("user_id", profile.id)

    if (!data?.length) {
      setFriends([])
      return
    }

    const friendIds = data.map((item) => item.friend_id)

    const { data: friendProfiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", friendIds)

    setFriends(friendProfiles || [])
  }

  async function searchUsers(value: string) {
    setSearch(value)

    if (!value.trim()) {
      setResults([])
      return
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${value}%`)
      .neq("id", profile?.id || "")

    setResults(data || [])
  }

  async function addFriend(friendId: string) {
    if (!profile) return

    await supabase.from("friends").insert({
      user_id: profile.id,
      friend_id: friendId,
    })

    alert("Friend added ✅")
    setSearch("")
    setResults([])
    loadFriends()
  }

  async function loadMessages() {
    if (!profile || !selectedFriend) return

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${profile.id},receiver_id.eq.${selectedFriend.id}),and(sender_id.eq.${selectedFriend.id},receiver_id.eq.${profile.id})`
      )
      .order("created_at", { ascending: true })

    setMessages(data || [])
  }

  async function markMessagesSeen() {
    if (!profile || !selectedFriend) return

    await supabase
      .from("messages")
      .update({ is_seen: true })
      .eq("sender_id", selectedFriend.id)
      .eq("receiver_id", profile.id)
      .eq("is_seen", false)
  }

  async function setTyping(value: boolean) {
    if (!profile) return

    await supabase
      .from("profiles")
      .update({ is_typing: value })
      .eq("id", profile.id)
  }

  function handleTyping(value: string) {
    setNewMessage(value)
    setTyping(true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false)
    }, 1500)
  }

  async function sendMessage() {
    if (!profile || !selectedFriend || !newMessage.trim()) return

    await setTyping(false)

    await supabase.from("messages").insert({
      sender_id: profile.id,
      receiver_id: selectedFriend.id,
      message: encryptMessage(newMessage.trim()),
      image_url: null,
      is_seen: false,
    })

    setNewMessage("")
    setShowEmoji(false)
  }

  async function sendImage(imageUrl: string) {
    if (!profile || !selectedFriend) return

    await supabase.from("messages").insert({
      sender_id: profile.id,
      receiver_id: selectedFriend.id,
      message: "",
      image_url: imageUrl,
      is_seen: false,
    })
  }

  function displayMessage(msg: Message) {
    if (!msg.message) return ""
    return decryptMessage(msg.message)
  }

  function renderTicks(msg: Message) {
    if (msg.sender_id !== profile?.id) return null

    return (
      <span className={`ml-2 text-xs ${msg.is_seen ? "text-blue-300" : "text-slate-300"}`}>
        {msg.is_seen ? "✓✓" : "✓"}
      </span>
    )
  }

  function friendStatus() {
    if (selectedFriend?.is_typing) return "Typing..."
    if (selectedFriend?.is_online) return "🟢 Online"
    return "⚫ Offline"
  }

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      <div
        className={`${
          selectedFriend ? "hidden md:flex" : "flex"
        } w-full md:w-80 bg-slate-950 border-r border-slate-800 flex-col`}
      >
        <div className="p-5 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-blue-400 mb-4">ZuzuChat</h1>

          <ProfileAvatar
            profile={profile}
            onUploaded={() => window.location.reload()}
          />

          <p className="text-slate-400 text-sm mt-3">
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
                <div className="flex items-center gap-3">
                  <img
                    src={
                      user.avatar_url ||
                      `https://api.dicebear.com/9.x/initials/svg?seed=${user.name}`
                    }
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />

                  <div>
                    <h3>{user.name}</h3>
                    <p className="text-sm text-slate-400">@{user.username}</p>
                  </div>
                </div>

                <button
                  onClick={() => addFriend(user.id)}
                  className="bg-blue-700 px-3 py-2 rounded-lg"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {friends.map((friend) => (
            <button
              key={friend.id}
              onClick={() => setSelectedFriend(friend)}
              className="w-full text-left bg-slate-900 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    friend.avatar_url ||
                    `https://api.dicebear.com/9.x/initials/svg?seed=${friend.name}`
                  }
                  alt="avatar"
                  className="w-11 h-11 rounded-full object-cover"
                />

                <div>
                  <h3>{friend.name}</h3>
                  <p className="text-sm text-slate-400">@{friend.username}</p>
                </div>
              </div>

              <div
                className={`w-3 h-3 rounded-full ${
                  friend.is_online ? "bg-green-500" : "bg-slate-600"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div
        className={`${
          selectedFriend ? "flex" : "hidden md:flex"
        } flex-1 flex-col bg-gradient-to-b from-slate-950 to-black min-w-0`}
      >
        {selectedFriend ? (
          <>
            <div className="h-20 border-b border-slate-800 px-3 md:px-6 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setSelectedFriend(null)}
                  className="md:hidden bg-slate-800 px-3 py-2 rounded-lg"
                >
                  ←
                </button>

                <img
                  src={
                    selectedFriend.avatar_url ||
                    `https://api.dicebear.com/9.x/initials/svg?seed=${selectedFriend.name}`
                  }
                  alt="avatar"
                  className="w-11 h-11 md:w-12 md:h-12 rounded-full object-cover"
                />

                <div className="min-w-0">
                  <h2 className="font-bold text-lg md:text-xl truncate">
                    {selectedFriend.name}
                  </h2>
                  <p className="text-slate-400 text-sm">{friendStatus()}</p>
                </div>
              </div>

              <div className="flex gap-2 md:gap-3">
                <VideoCall profile={profile} selectedFriend={selectedFriend} audioOnly />
                <VideoCall profile={profile} selectedFriend={selectedFriend} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender_id === profile?.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl max-w-[80%] md:max-w-md ${
                      msg.sender_id === profile?.id ? "bg-blue-700" : "bg-slate-800"
                    }`}
                  >
                    {msg.image_url && (
                      <img
                        src={msg.image_url}
                        alt="chat image"
                        className="max-w-full md:max-w-xs rounded-xl mb-2"
                      />
                    )}

                    {msg.message && <p className="break-words">{displayMessage(msg)}</p>}

                    <div className="flex justify-end">{renderTicks(msg)}</div>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            <div className="relative p-3 md:p-4 border-t border-slate-800 flex gap-2 md:gap-3">
              {showEmoji && (
                <div className="absolute bottom-20 left-2 md:left-4 z-50 scale-90 md:scale-100 origin-bottom-left">
                  <EmojiPicker
                    onEmojiClick={(emojiData) =>
                      setNewMessage((prev) => prev + emojiData.emoji)
                    }
                    theme={Theme.DARK}
                  />
                </div>
              )}

              <button
                onClick={() => setShowEmoji(!showEmoji)}
                className="bg-slate-800 px-3 md:px-4 rounded-xl"
              >
                😊
              </button>

              <ImageUpload
                profile={profile}
                selectedFriend={selectedFriend}
                onUploaded={sendImage}
              />

              <input
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage()
                }}
                placeholder="Message..."
                className="min-w-0 flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 md:px-4 py-3 text-white"
              />

              <button
                onClick={sendMessage}
                className="bg-blue-700 hover:bg-blue-600 px-4 md:px-6 rounded-xl"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-3xl">
            Select a friend 🚀
          </div>
        )}
      </div>
    </div>
  )
}