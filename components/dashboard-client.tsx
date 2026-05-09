"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { UserDataForm } from "@/components/user-data-form"
import { DietRecommendation } from "@/components/diet-recommendation"
import { FoodAnalysis } from "@/components/food-analysis"
import { ProgressMonitoring } from "@/components/progress-monitoring"
import { PersonalizedFeedback } from "@/components/personalized-feedback"

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

type User = {
  id: string
  email: string
  name: string
}

type DashboardClientProps = {
  user: User
  initialProfile: UserData | null
  initialWeightLogs: WeightLog[]
  initialFoodEntries: FoodEntry[]
}

export function DashboardClient({ 
  user, 
  initialProfile, 
  initialWeightLogs, 
  initialFoodEntries 
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState("home")
  const [userData, setUserData] = useState<UserData | null>(initialProfile)
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>(initialWeightLogs)
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>(initialFoodEntries)

  const addWeightLog = (log: WeightLog) => {
    setWeightLogs([log, ...weightLogs])
  }

  const removeWeightLog = (logId: number) => {
    setWeightLogs(weightLogs.filter(log => log.id !== logId))
  }

  const addFoodEntry = (entry: FoodEntry) => {
    setFoodEntries([...foodEntries, entry])
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <UserDataForm 
            userData={userData} 
            setUserData={setUserData} 
            onComplete={() => setActiveTab("diet")} 
            userId={user.id}
            weightLogs={weightLogs}
            addWeightLog={addWeightLog}
            removeWeightLog={removeWeightLog}
          />
        )
      case "diet":
        return <DietRecommendation userData={userData} />
      case "food":
        return <FoodAnalysis userData={userData} foodEntries={foodEntries} addFoodEntry={addFoodEntry} />
      case "progress":
        return <ProgressMonitoring userData={userData} weightLogs={weightLogs} addWeightLog={addWeightLog} />
      case "feedback":
        return <PersonalizedFeedback userData={userData} foodEntries={foodEntries} weightLogs={weightLogs} />
      default:
        return <UserDataForm userData={userData} setUserData={setUserData} userId={user.id} />
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userName={user.name || user.email} />
      <main className="flex-1 p-4 pt-20 md:pt-6 md:p-8 lg:p-10">{renderContent()}</main>
    </div>
  )
}
