"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

type Profile = {
  id: string
  name: string
  username: string
}

export default function ImageUpload({
  profile,
  selectedFriend,
  onUploaded,
}: {
  profile: Profile | null
  selectedFriend: Profile | null
  onUploaded: (imageUrl: string) => void
}) {
  const [uploading, setUploading] = useState(false)

  async function uploadImage(file: File) {
    if (!profile || !selectedFriend) return

    setUploading(true)

    const fileExt = file.name.split(".").pop()
    const filePath = `${profile.id}-${selectedFriend.id}-${Date.now()}.${fileExt}`

    const { error } = await supabase.storage
      .from("chat-images")
      .upload(filePath, file)

    if (error) {
      alert(error.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from("chat-images").getPublicUrl(filePath)

    onUploaded(data.publicUrl)
    setUploading(false)
  }

  return (
    <label className="cursor-pointer bg-slate-800 hover:bg-blue-700 px-4 rounded-xl flex items-center">
      {uploading ? "..." : "📎"}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) uploadImage(file)
        }}
      />
    </label>
  )
}