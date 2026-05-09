"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { UserData, FoodEntry } from "@/app/dashboard/page"
import { Camera, Upload, Clock, Utensils } from "lucide-react"

type FoodAnalysisProps = {
  userData: UserData | null
  foodEntries: FoodEntry[]
  addFoodEntry: (entry: FoodEntry) => void
}

export function FoodAnalysis({ userData, foodEntries, addFoodEntry }: FoodAnalysisProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-balance">Food & Nutrition Analysis</h2>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          AI-powered food detection and nutrition tracking
        </p>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Coming Soon
          </CardTitle>
          <CardDescription>AI Food Detection & Nutrition Analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-lg p-6 md:p-12 text-center space-y-4">
            <div className="flex justify-center gap-4">
              <Camera className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
              <Upload className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-semibold">AI-Powered Food Analysis</h3>
              <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
                Upload photos of your meals and get instant nutrition information powered by AI. This feature is
                currently under development and will be available soon.
              </p>
            </div>
            <div className="pt-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Feature in Development</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Features</CardTitle>
          <CardDescription>What to expect in the food analysis module</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">AI Food Recognition</p>
                <p className="text-sm text-muted-foreground">
                  Automatically identify foods from photos using advanced AI
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">Instant Nutrition Facts</p>
                <p className="text-sm text-muted-foreground">
                  Get detailed calorie and macro breakdowns for every meal
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">Daily Tracking</p>
                <p className="text-sm text-muted-foreground">
                  Monitor your daily intake and stay on track with your goals
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <div>
                <p className="font-medium">Meal History</p>
                <p className="text-sm text-muted-foreground">Keep a visual log of all your meals with nutrition data</p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
