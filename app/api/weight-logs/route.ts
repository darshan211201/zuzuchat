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
      SELECT id, weight, bmi, log_date as date
      FROM weight_logs
      WHERE user_id = ${userId}
      ORDER BY log_date DESC
      LIMIT 30
    `

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error fetching weight logs:", error)
    return NextResponse.json({ error: "Failed to fetch weight logs" }, { status: 500 })
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
    const result = await db`
      INSERT INTO weight_logs (user_id, weight, bmi, log_date)
      VALUES (${userId}, ${data.weight}, ${data.bmi}, ${data.date})
      RETURNING id, weight, bmi, log_date as date
    `

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("[v0] Error adding weight log:", error)
    return NextResponse.json({ error: "Failed to add weight log" }, { status: 500 })
  }
}
