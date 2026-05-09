import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const userId = await getSession()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = sql()
    const result = await db`
      SELECT height, weight, age, gender, activity_level as "activityLevel"
      FROM user_profiles
      WHERE id = ${userId}
    `

    if (result.length === 0) {
      return NextResponse.json(null)
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Error fetching profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSession()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    const db = sql()

    const users = await db`SELECT email FROM users WHERE id = ${userId}`
    const userEmail = users[0]?.email

    if (!userEmail) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await db`
      INSERT INTO user_profiles (id, email, height, weight, age, gender, activity_level, updated_at)
      VALUES (
        ${userId},
        ${userEmail},
        ${data.height},
        ${data.weight},
        ${data.age},
        ${data.gender},
        ${data.activityLevel},
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE SET
        email = ${userEmail},
        height = ${data.height},
        weight = ${data.weight},
        age = ${data.age},
        gender = ${data.gender},
        activity_level = ${data.activityLevel},
        updated_at = CURRENT_TIMESTAMP
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving profile:", error)
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 })
  }
}
