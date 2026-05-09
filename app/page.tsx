"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push("/sign-in")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      <div className="text-center">
        <div className="h-10 w-10 mx-auto mb-4 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
        
        <h1 className="text-2xl font-bold text-white mb-2">
          ZuzuChat
        </h1>

        <p className="text-sm text-slate-400">
          Loading ZuzuChat...
        </p>
      </div>
    </div>
  )
}