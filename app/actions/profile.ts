"use server"

import { getSession } from "@/lib/auth"
import { sql } from "@/lib/db"

export type ProfileData = {
  height: number
  weight: number
  age: number
  gender: "male" | "female" | "other"
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very-active"
}

export async function saveProfile(data: ProfileData, userId?: string) {
  // Use provided userId or fallback to session
  let effectiveUserId = userId
  if (!effectiveUserId) {
    effectiveUserId = await getSession()
  }
  
  if (!effectiveUserId) {
    return { error: "Unauthorized" }
  }

  try {
    const db = sql()
    
    // Get user email
    const users = await db`SELECT email FROM users WHERE id = ${effectiveUserId}`
    const userEmail = users[0]?.email

    if (!userEmail) {
      return { error: "User not found" }
    }

    // Upsert profile
    await db`
      INSERT INTO user_profiles (id, email, height, weight, age, gender, activity_level, updated_at)
      VALUES (
        ${effectiveUserId},
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

    // Calculate BMI
    const bmi = data.weight / Math.pow(data.height / 100, 2)
    const bmiCategory = getBMICategory(bmi)

    return { 
      success: true, 
      bmi, 
      bmiCategory 
    }
  } catch (error) {
    console.error("[v0] Error saving profile:", error)
    return { error: "Failed to save profile" }
  }
}

function getBMICategory(bmi: number) {
  if (bmi < 18.5) return "Underweight"
  if (bmi < 25) return "Normal"
  if (bmi < 30) return "Overweight"
  return "Obese"
}

export async function addWeightLogAction(data: { date: string; weight: number; bmi: number }, passedUserId?: string) {
  const userId = passedUserId || await getSession()
  
  if (!userId) {
    return { error: "Unauthorized" }
  }

  try {
    const db = sql()
    
    const result = await db`
      INSERT INTO weight_logs (user_id, log_date, weight, bmi)
      VALUES (${userId}, ${data.date}, ${data.weight}, ${data.bmi})
      RETURNING id, log_date as date, weight, bmi
    `

    return { success: true, log: result[0] }
  } catch (error) {
    console.error("[v0] Error adding weight log:", error)
    return { error: "Failed to add weight log" }
  }
}

export async function deleteWeightLogAction(logId: number, passedUserId?: string) {
  const userId = passedUserId || await getSession()
  
  if (!userId) {
    return { error: "Unauthorized" }
  }

  try {
    const db = sql()
    
    await db`
      DELETE FROM weight_logs 
      WHERE id = ${logId} AND user_id = ${userId}
    `

    return { success: true }
  } catch (error) {
    console.error("[v0] Error deleting weight log:", error)
    return { error: "Failed to delete weight log" }
  }
}

export async function addFoodEntryAction(data: {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  sugar: number
}) {
  const userId = await getSession()
  
  if (!userId) {
    return { error: "Unauthorized" }
  }

  try {
    const db = sql()
    
    const result = await db`
      INSERT INTO food_entries (user_id, name, calories, protein, carbs, fat, sugar)
      VALUES (${userId}, ${data.name}, ${data.calories}, ${data.protein}, ${data.carbs}, ${data.fat}, ${data.sugar})
      RETURNING id, name, calories, protein, carbs, fat, sugar
    `

    return { success: true, entry: result[0] }
  } catch (error) {
    console.error("[v0] Error adding food entry:", error)
    return { error: "Failed to add food entry" }
  }
}
