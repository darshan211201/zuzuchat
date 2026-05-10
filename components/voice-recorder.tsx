"use client"

import { useRef, useState } from "react"
import { supabase } from "@/lib/supabase"

type Profile = {
  id: string
  name: string
  username: string
}

export default function VoiceRecorder({
  profile,
  selectedFriend,
  onUploaded,
}: {
  profile: Profile | null
  selectedFriend: Profile | null
  onUploaded: (audioUrl: string) => void
}) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [recording, setRecording] = useState(false)

  async function startRecording() {
    if (!profile || !selectedFriend) return

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)

    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" })
      const filePath = `${profile.id}-${selectedFriend.id}-${Date.now()}.webm`

      const { error } = await supabase.storage
        .from("voice-notes")
        .upload(filePath, blob)

      if (error) {
        alert(error.message)
        return
      }

      const { data } = supabase.storage.from("voice-notes").getPublicUrl(filePath)

      onUploaded(data.publicUrl)
      stream.getTracks().forEach((track) => track.stop())
    }

    mediaRecorderRef.current = recorder
    recorder.start()
    setRecording(true)
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  return (
    <button
      onClick={recording ? stopRecording : startRecording}
      className={`px-4 rounded-xl ${
        recording ? "bg-red-600" : "bg-slate-800 hover:bg-blue-700"
      }`}
    >
      {recording ? "⏹" : "🎤"}
    </button>
  )
}