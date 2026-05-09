"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createSession, deleteSession } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    return { error: "Invalid email or password" }
  }

  await createSession(data.user.id)

  const cookieStore = await cookies()
  cookieStore.set("zuzu_user_id", data.user.id)

  redirect("/chat")
}

export async function signUp(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!name || !email || !password || !confirmPassword) {
    return { error: "All fields are required" }
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  })

  if (error || !data.user) {
    return { error: error?.message || "Signup failed" }
  }

  await createSession(data.user.id)

  const cookieStore = await cookies()
  cookieStore.set("zuzu_user_id", data.user.id)

  redirect("/chat")
}

export async function signOut() {
  await deleteSession()

  const cookieStore = await cookies()
  cookieStore.delete("zuzu_user_id")

  redirect("/")
}