"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { UserData, WeightLog } from "@/app/dashboard/page"
import { saveProfile, addWeightLogAction, deleteWeightLogAction } from "@/app/actions/profile"
import { Activity, User, Ruler, Weight, Trash2, Calendar } from "lucide-react"

type UserDataFormProps = {
  userData: UserData | null
  setUserData: (data: UserData) => void
  onComplete?: () => void
  userId: string
  weightLogs: WeightLog[]
  addWeightLog: (log: WeightLog) => void
  removeWeightLog: (logId: number) => void
}

export function UserDataForm({ userData, setUserData, onComplete, userId, weightLogs, addWeightLog, removeWeightLog }: UserDataFormProps) {
  const [formData, setFormData] = useState<UserData>({
    height: userData?.height || 0,
    weight: userData?.weight || 0,
    age: userData?.age || 0,
    gender: userData?.gender || "male",
    activityLevel: userData?.activityLevel || "moderate",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (userData) {
      setFormData(userData)
    }
  }, [userData])

  const calculateBMI = (weight: number, height: number) => {
    if (weight > 0 && height > 0) {
      const heightInMeters = height / 100
      return weight / (heightInMeters * heightInMeters)
    }
    return 0
  }

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: "Underweight", color: "text-blue-600" }
    if (bmi < 25) return { category: "Normal", color: "text-green-600" }
    if (bmi < 30) return { category: "Overweight", color: "text-yellow-600" }
    return { category: "Obese", color: "text-red-600" }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const result = await saveProfile(formData, userId)

      if (result.success && result.bmi) {
        const updatedData = {
          ...formData,
          bmi: result.bmi,
          bmiCategory: result.bmiCategory,
        }

        setUserData(updatedData)
        
        // Add weight log entry
        const today = new Date().toISOString().split('T')[0]
        const logResult = await addWeightLogAction({
          date: today,
          weight: formData.weight,
          bmi: result.bmi
        }, userId)
        
        if (logResult.success && logResult.log) {
          addWeightLog(logResult.log as WeightLog)
        }
        
        // Reset form to empty state
        setFormData({
          height: 0,
          weight: 0,
          age: 0,
          gender: "male",
          activityLevel: "moderate",
        })
        
        // Redirect to Diet Plan tab after saving
        if (onComplete) {
          onComplete()
        }
      } else if (result.error) {
        console.error("[v0] Error saving profile:", result.error)
      }
    } catch (error) {
      console.error("[v0] Error saving profile:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLog = async (logId: number) => {
    const result = await deleteWeightLogAction(logId, userId)
    if (result.success) {
      removeWeightLog(logId)
    }
  }

  const bmi = calculateBMI(formData.weight, formData.height)
  const bmiInfo = bmi > 0 ? getBMICategory(bmi) : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-balance">Welcome to NutriTrack</h2>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          Enter your information to get personalized health insights
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>Tell us about yourself</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    className="pl-10"
                    value={formData.height || ""}
                    onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <div className="relative">
                  <Weight className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    className="pl-10"
                    value={formData.weight || ""}
                    onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  value={formData.age || ""}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value: any) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger id="gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activity">Activity Level</Label>
                <Select
                  value={formData.activityLevel}
                  onValueChange={(value: any) => setFormData({ ...formData, activityLevel: value })}
                >
                  <SelectTrigger id="activity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                    <SelectItem value="light">Light (exercise 1-3 days/week)</SelectItem>
                    <SelectItem value="moderate">Moderate (exercise 3-5 days/week)</SelectItem>
                    <SelectItem value="active">Active (exercise 6-7 days/week)</SelectItem>
                    <SelectItem value="very-active">Very Active (intense exercise daily)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Calculating..." : "Calculate My Diet Plan"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Your BMI Result
            </CardTitle>
            <CardDescription>Body Mass Index calculation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {bmiInfo ? (
              <>
                <div className="text-center space-y-2">
                  <div className="text-6xl font-bold text-primary">{bmi.toFixed(1)}</div>
                  <div className={`text-2xl font-semibold ${bmiInfo.color}`}>{bmiInfo.category}</div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Underweight</span>
                    <span className="text-muted-foreground">{"< 18.5"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Normal</span>
                    <span className="text-muted-foreground">18.5 - 24.9</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overweight</span>
                    <span className="text-muted-foreground">25 - 29.9</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Obese</span>
                    <span className="text-muted-foreground">≥ 30</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Enter your details to calculate your BMI</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Weight Logs */}
      {weightLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Recent Weight Logs
            </CardTitle>
            <CardDescription>Your recent weight tracking entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weightLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{log.weight} kg</p>
                      <p className="text-sm text-muted-foreground">BMI: {typeof log.bmi === 'number' ? log.bmi.toFixed(1) : log.bmi}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {log.date ? new Date(log.date).toLocaleDateString() : '-'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => log.id && handleDeleteLog(log.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {weightLogs.length > 5 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                +{weightLogs.length - 5} more entries in Progress tab
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
