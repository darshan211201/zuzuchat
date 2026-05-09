import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const userId = await getSession()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date().toISOString().split("T")[0]

    const db = sql()
    const result = await db`
      SELECT id, name, calories, protein, carbs, fat, sugar, image_url as "imageUrl"
      FROM food_entries
      WHERE user_id = ${userId} AND entry_date = ${today}
      ORDER BY created_at DESC
    `

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error fetching food entries:", error)
    return NextResponse.json({ error: "Failed to fetch food entries" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getSession()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const today = new Date().toISOString().split("T")[0]

    const db = sql()
    const result = await db`
      INSERT INTO food_entries (user_id, name, calories, protein, carbs, fat, sugar, image_url, entry_date)
      VALUES (
        ${userId},
        ${data.name},
        ${data.calories},
        ${data.protein},
        ${data.carbs},
        ${data.fat},
        ${data.sugar},
        ${data.imageUrl || null},
        ${today}
      )
      RETURNING id, name, calories, protein, carbs, fat, sugar, image_url as "imageUrl"
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Error adding food entry:", error)
    return NextResponse.json({ error: "Failed to add food entry" }, { status: 500 })
  }
}
