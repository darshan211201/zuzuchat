import { redirect } from "next/navigation"
import { getCurrentUser, getSession } from "@/lib/auth"
import { DashboardClient } from "@/components/dashboard-client"
import { sql } from "@/lib/db"

export type UserData = {
  height: number
  weight: number
  age: number
  gender: "male" | "female" | "other"
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very-active"
  bmi?: number
  bmiCategory?: string
  dailyCalories?: number
}

export type WeightLog = {
  id?: number
  date: string
  weight: number
  bmi: number
}

export type FoodEntry = {
  id?: number
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  sugar: number
  imageUrl?: string
}

function getBMICategory(bmi: number) {
  if (bmi < 18.5) return "Underweight"
  if (bmi < 25) return "Normal"
  if (bmi < 30) return "Overweight"
  return "Obese"
}

async function getProfileData(userId: string): Promise<UserData | null> {
  try {
    const db = sql()
    const result = await db`
      SELECT height, weight, age, gender, activity_level as "activityLevel"
      FROM user_profiles
      WHERE id = ${userId}
    `
    if (result.length === 0) return null
    
    const profile = result[0] as UserData
    const bmi = profile.weight / Math.pow(profile.height / 100, 2)
    
    return {
      ...profile,
      bmi,
      bmiCategory: getBMICategory(bmi),
    }
  } catch (error) {
    console.error("[v0] Error fetching profile:", error)
    return null
  }
}

async function getWeightLogs(userId: string): Promise<WeightLog[]> {
  try {
    const db = sql()
    const result = await db`
      SELECT id, log_date as date, weight, bmi
      FROM weight_logs
      WHERE user_id = ${userId}
      ORDER BY log_date DESC
    `
    return result as WeightLog[]
  } catch (error) {
    console.error("[v0] Error fetching weight logs:", error)
    return []
  }
}

async function getFoodEntries(userId: string): Promise<FoodEntry[]> {
  try {
    const db = sql()
    const result = await db`
      SELECT id, name, calories, protein, carbs, fat, sugar, image_url as "imageUrl"
      FROM food_entries
      WHERE user_id = ${userId}
      AND DATE(created_at) = CURRENT_DATE
      ORDER BY created_at DESC
    `
    return result as FoodEntry[]
  } catch (error) {
    console.error("[v0] Error fetching food entries:", error)
    return []
  }
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const userId = await getSession()

  if (!user || !userId) {
    redirect("/sign-in")
  }

  // Fetch all data server-side
  const [profile, weightLogs, foodEntries] = await Promise.all([
    getProfileData(userId),
    getWeightLogs(userId),
    getFoodEntries(userId),
  ])

  return (
    <DashboardClient
      user={user}
      initialProfile={profile}
      initialWeightLogs={weightLogs}
      initialFoodEntries={foodEntries}
    />
  )
}
