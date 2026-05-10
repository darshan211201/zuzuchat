"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

type Profile = {
  id: string
  name: string
  username: string
  avatar_url?: string | null
}

export default function ProfileAvatar({
  profile,
  onUploaded,
}: {
  profile: Profile | null
  onUploaded?: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)

  async function uploadAvatar(file: File) {
    if (!profile) return

    setUploading(true)

    const fileExt = file.name.split(".").pop()
    const filePath = `${profile.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file)

    if (uploadError) {
      alert(uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
    const publicUrl = data.publicUrl

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", profile.id)

    if (updateError) {
      alert(updateError.message)
      setUploading(false)
      return
    }

    onUploaded?.(publicUrl)
    setUploading(false)
    alert("Profile picture updated ✅")
  }

  return (
    <div className="flex items-center gap-3">
      <img
        src={profile?.avatar_url || "https://api.dicebear.com/9.x/initials/svg?seed=Zuzu"}
        alt="avatar"
        className="w-12 h-12 rounded-full object-cover border border-blue-800"
      />

      <label className="cursor-pointer bg-slate-800 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm">
        {uploading ? "Uploading..." : "Change"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) uploadAvatar(file)
          }}
        />
      </label>
    </div>
  )
}