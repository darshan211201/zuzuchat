import OpenAI from "openai"
import { NextResponse } from "next/server"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    if (!message) {
      return NextResponse.json(
        { reply: "Please type something first." },
        { status: 400 }
      )
    }

    const response = await client.responses.create({
      model: "gpt-5.5",
      instructions:
        "You are ZuzuBot inside ZuzuChat. Reply friendly, short, helpful, and casual.",
      input: message,
    })

    return NextResponse.json({
      reply: response.output_text || "No reply generated.",
    })
  } catch (error) {
    console.error("AI error:", error)

    return NextResponse.json(
      { reply: "AI bot failed. Check API key or server logs." },
      { status: 500 }
    )
  }
}
