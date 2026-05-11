"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import VideoCall from "@/components/video-call"
import EmojiPicker, { Theme } from "emoji-picker-react"
import ProfileAvatar from "@/components/profile-avatar"
import ImageUpload from "@/components/image-upload"
import VoiceRecorder from "@/components/voice-recorder"
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
  audio_url?: string | null
  file_url?: string | null
  file_name?: string | null
  file_type?: string | null
  reply_to_id?: string | null
  is_edited?: boolean
  edited_at?: string | null
  created_at: string
  is_seen?: boolean
  is_deleted?: boolean
}

const wallpapers = [
  "from-slate-950 to-black",
  "from-blue-950 to-black",
  "from-purple-950 to-black",
  "from-emerald-950 to-black",
  "from-rose-950 to-black",
]

export default function ChatClient({ profile }: { profile: Profile | null }) {
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<Profile[]>([])
  const [friends, setFriends] = useState<Profile[]>([])
  const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [newMessage, setNewMessage] = useState("")
  const [showEmoji, setShowEmoji] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [editingMsg, setEditingMsg] = useState<Message | null>(null)
  const [wallpaper, setWallpaper] = useState(wallpapers[0])
  const [showThemes, setShowThemes] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("zuzuchat_wallpaper")
    if (saved) setWallpaper(saved)
  }, [])

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
    loadUnreadCounts()
  }, [profile])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!profile) return

    const unreadChannel = supabase
      .channel(`unread-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${profile.id}`,
        },
        () => loadUnreadCounts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(unreadChannel)
    }
  }, [profile])

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
            loadUnreadCounts()
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

  async function loadUnreadCounts() {
    if (!profile) return

    const { data } = await supabase
      .from("messages")
      .select("sender_id")
      .eq("receiver_id", profile.id)
      .eq("is_seen", false)
      .eq("is_deleted", false)

    const counts: Record<string, number> = {}

    ;(data || []).forEach((msg) => {
      counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1
    })

    setUnreadCounts(counts)
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

    setUnreadCounts((prev) => ({
      ...prev,
      [selectedFriend.id]: 0,
    }))
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

    if (editingMsg) {
      await supabase
        .from("messages")
        .update({
          message: encryptMessage(newMessage.trim()),
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq("id", editingMsg.id)
        .eq("sender_id", profile.id)

      setEditingMsg(null)
      setNewMessage("")
      setShowEmoji(false)
      return
    }

    await supabase.from("messages").insert({
      sender_id: profile.id,
      receiver_id: selectedFriend.id,
      message: encryptMessage(newMessage.trim()),
      image_url: null,
      audio_url: null,
      file_url: null,
      file_name: null,
      file_type: null,
      reply_to_id: replyingTo?.id || null,
      is_seen: false,
      is_deleted: false,
    })

    setNewMessage("")
    setReplyingTo(null)
    setShowEmoji(false)
  }

  async function sendImage(imageUrl: string) {
    if (!profile || !selectedFriend) return

    await supabase.from("messages").insert({
      sender_id: profile.id,
      receiver_id: selectedFriend.id,
      message: "",
      image_url: imageUrl,
      audio_url: null,
      file_url: null,
      file_name: null,
      file_type: null,
      reply_to_id: replyingTo?.id || null,
      is_seen: false,
      is_deleted: false,
    })

    setReplyingTo(null)
  }

  async function sendAudio(audioUrl: string) {
    if (!profile || !selectedFriend) return

    await supabase.from("messages").insert({
      sender_id: profile.id,
      receiver_id: selectedFriend.id,
      message: "",
      image_url: null,
      audio_url: audioUrl,
      file_url: null,
      file_name: null,
      file_type: null,
      reply_to_id: replyingTo?.id || null,
      is_seen: false,
      is_deleted: false,
    })

    setReplyingTo(null)
  }

  async function sendFile(file: File) {
    if (!profile || !selectedFriend) return

    const filePath = `${profile.id}/${Date.now()}-${file.name}`

    const { error } = await supabase.storage
      .from("chat-files")
      .upload(filePath, file)

    if (error) {
      alert("File upload failed ❌")
      return
    }

    const { data } = supabase.storage
      .from("chat-files")
      .getPublicUrl(filePath)

    await supabase.from("messages").insert({
      sender_id: profile.id,
      receiver_id: selectedFriend.id,
      message: "",
      image_url: null,
      audio_url: null,
      file_url: data.publicUrl,
      file_name: file.name,
      file_type: file.type,
      reply_to_id: replyingTo?.id || null,
      is_seen: false,
      is_deleted: false,
    })

    setReplyingTo(null)
  }

  async function deleteMessage(msg: Message) {
    if (!profile || msg.sender_id !== profile.id) return

    const confirmDelete = confirm("Delete this message for everyone?")
    if (!confirmDelete) return

    await supabase
      .from("messages")
      .update({
        is_deleted: true,
        message: "",
        image_url: null,
        audio_url: null,
        file_url: null,
        file_name: null,
        file_type: null,
      })
      .eq("id", msg.id)
  }

  function startEdit(msg: Message) {
    if (msg.sender_id !== profile?.id || msg.is_deleted) return
    if (!msg.message) return alert("Only text messages can be edited")

    setEditingMsg(msg)
    setReplyingTo(null)
    setNewMessage(displayMessage(msg))
    setOpenMenuId(null)
  }

  function startReply(msg: Message) {
    if (msg.is_deleted) return
    setReplyingTo(msg)
    setEditingMsg(null)
    setOpenMenuId(null)
  }

  function displayMessage(msg: Message) {
    if (msg.is_deleted) return "This message was deleted"
    if (!msg.message) return ""
    return decryptMessage(msg.message)
  }

  function findReplyMessage(replyId?: string | null) {
    if (!replyId) return null
    return messages.find((m) => m.id === replyId) || null
  }

  function renderTicks(msg: Message) {
    if (msg.sender_id !== profile?.id || msg.is_deleted) return null

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

  function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function changeWallpaper(value: string) {
    setWallpaper(value)
    localStorage.setItem("zuzuchat_wallpaper", value)
    setShowThemes(false)
  }

  async function askAI() {
    if (!profile || !selectedFriend || !newMessage.trim()) return

    setAiLoading(true)

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage.trim() }),
      })

      const data = await res.json()

      await supabase.from("messages").insert({
        sender_id: profile.id,
        receiver_id: selectedFriend.id,
        message: encryptMessage(`🤖 AI: ${data.reply || "No response"}`),
        image_url: null,
        audio_url: null,
        file_url: null,
        file_name: null,
        file_type: null,
        reply_to_id: replyingTo?.id || null,
        is_seen: false,
        is_deleted: false,
      })

      setNewMessage("")
      setReplyingTo(null)
    } catch {
      alert("AI bot error ❌")
    } finally {
      setAiLoading(false)
    }
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
          {friends.map((friend) => {
            const unread = unreadCounts[friend.id] || 0

            return (
              <button
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className="w-full text-left bg-slate-900 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      friend.avatar_url ||
                      `https://api.dicebear.com/9.x/initials/svg?seed=${friend.name}`
                    }
                    alt="avatar"
                    className="w-11 h-11 rounded-full object-cover"
                  />

                  <div className="min-w-0">
                    <h3 className="truncate">{friend.name}</h3>
                    <p className="text-sm text-slate-400 truncate">@{friend.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <span className="bg-red-600 text-white text-xs min-w-6 h-6 px-2 rounded-full flex items-center justify-center">
                      {unread}
                    </span>
                  )}

                  <div
                    className={`w-3 h-3 rounded-full ${
                      friend.is_online ? "bg-green-500" : "bg-slate-600"
                    }`}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div
        className={`${
          selectedFriend ? "flex" : "hidden md:flex"
        } flex-1 flex-col bg-gradient-to-b ${wallpaper} min-w-0`}
      >
        {selectedFriend ? (
          <>
            <div className="h-20 border-b border-slate-800 px-3 md:px-6 flex items-center justify-between bg-black/30 backdrop-blur">
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

              <div className="flex gap-2 md:gap-3 relative">
                <button
                  onClick={() => setShowThemes(!showThemes)}
                  className="bg-slate-800 px-3 py-2 rounded-xl"
                >
                  🎨
                </button>

                {showThemes && (
                  <div className="absolute top-12 right-0 bg-slate-900 border border-slate-700 rounded-xl p-2 z-50 space-y-2 w-44">
                    {wallpapers.map((w, index) => (
                      <button
                        key={w}
                        onClick={() => changeWallpaper(w)}
                        className={`w-full text-left px-3 py-2 rounded-lg bg-gradient-to-r ${w}`}
                      >
                        Theme {index + 1}
                      </button>
                    ))}
                  </div>
                )}

                <VideoCall profile={profile} selectedFriend={selectedFriend} audioOnly />
                <VideoCall profile={profile} selectedFriend={selectedFriend} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4">
              {messages.map((msg) => {
                const replied = findReplyMessage(msg.reply_to_id)

                return (
                  <div
                    key={msg.id}
                    className={`group flex ${
                      msg.sender_id === profile?.id ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
  className={`flex items-end gap-2 max-w-[85%] md:max-w-md ${
    msg.sender_id === profile?.id ? "flex-row" : "flex-row-reverse"
  }`}
>
                      {!msg.is_deleted && (
                        <div className="relative mb-2">
                          <button
                            onClick={() =>
                              setOpenMenuId(openMenuId === msg.id ? null : msg.id)
                            }
                            className="text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-900"
                          >
                            ⋮
                          </button>

                          {openMenuId === msg.id && (
                            <div className="absolute right-0 bottom-8 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 min-w-36">
                              <button
                                onClick={() => startReply(msg)}
                                className="w-full text-left px-4 py-3 hover:bg-slate-800 rounded-xl"
                              >
                                ↩️ Reply
                              </button>

                              {msg.sender_id === profile?.id && msg.message && (
                                <button
                                  onClick={() => startEdit(msg)}
                                  className="w-full text-left px-4 py-3 hover:bg-slate-800 rounded-xl"
                                >
                                  ✏️ Edit
                                </button>
                              )}

                              {msg.sender_id === profile?.id && (
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null)
                                    deleteMessage(msg)
                                  }}
                                  className="w-full text-left px-4 py-3 text-red-400 hover:bg-slate-800 rounded-xl"
                                >
                                  🗑 Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          msg.is_deleted
                            ? "bg-slate-900 text-slate-500 italic border border-slate-800"
                            : msg.sender_id === profile?.id
                            ? "bg-blue-700"
                            : "bg-slate-800"
                        }`}
                      >
                        {replied && !msg.is_deleted && (
                          <div className="mb-2 border-l-4 border-blue-300 pl-2 bg-black/20 rounded p-2 text-xs text-slate-300">
                            <p className="font-semibold">Replying to</p>
                            <p className="truncate">
                              {replied.is_deleted
                                ? "Deleted message"
                                : displayMessage(replied) ||
                                  replied.file_name ||
                                  (replied.image_url ? "Image" : replied.audio_url ? "Audio" : "")}
                            </p>
                          </div>
                        )}

                        {msg.image_url && !msg.is_deleted && (
                          <img
                            src={msg.image_url}
                            alt="chat image"
                            className="max-w-full md:max-w-xs rounded-xl mb-2"
                          />
                        )}

                        {msg.audio_url && !msg.is_deleted && (
                          <audio controls src={msg.audio_url} className="mb-2 w-full" />
                        )}

                        {msg.file_url && !msg.is_deleted && (
                          <a
                            href={msg.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-black/30 rounded-xl p-3 mb-2 hover:bg-black/50"
                          >
                            📄 {msg.file_name || "Download file"}
                          </a>
                        )}

                        <p className="break-words">{displayMessage(msg)}</p>

                        <div className="flex items-center justify-end gap-1 mt-1">
                          {msg.is_edited && !msg.is_deleted && (
                            <span className="text-[10px] text-slate-300">edited</span>
                          )}
                          <span className="text-[10px] text-slate-300">
                            {formatTime(msg.created_at)}
                          </span>
                          {renderTicks(msg)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              <div ref={messagesEndRef} />
            </div>

            {(replyingTo || editingMsg) && (
              <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
                <div className="text-sm text-slate-300 truncate">
                  {editingMsg ? (
                    <>✏️ Editing: {displayMessage(editingMsg)}</>
                  ) : (
                    <>↩️ Replying to: {replyingTo ? displayMessage(replyingTo) || replyingTo.file_name || "Media" : ""}</>
                  )}
                </div>

                <button
                  onClick={() => {
                    setReplyingTo(null)
                    setEditingMsg(null)
                    setNewMessage("")
                  }}
                  className="text-red-400 px-3"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="relative p-3 md:p-4 border-t border-slate-800 flex gap-2 md:gap-3 bg-black/30 backdrop-blur">
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

              <VoiceRecorder
                profile={profile}
                selectedFriend={selectedFriend}
                onUploaded={sendAudio}
              />

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) sendFile(file)
                  e.target.value = ""
                }}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-800 px-3 md:px-4 rounded-xl"
              >
                📄
              </button>

              <input
                value={newMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage()
                }}
                placeholder={editingMsg ? "Edit message..." : "Message..."}
                className="min-w-0 flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 md:px-4 py-3 text-white"
              />

              <button
                onClick={askAI}
                disabled={aiLoading}
                className="bg-purple-700 hover:bg-purple-600 px-3 md:px-4 rounded-xl disabled:opacity-50"
              >
                🤖
              </button>

              <button
                onClick={sendMessage}
                className="bg-blue-700 hover:bg-blue-600 px-4 md:px-6 rounded-xl"
              >
                {editingMsg ? "Save" : "Send"}
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