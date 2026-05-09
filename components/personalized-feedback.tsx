import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { UserData, FoodEntry, WeightLog } from "@/app/dashboard/page"
import { Lightbulb, Heart, TrendingUp, Award } from "lucide-react"

type PersonalizedFeedbackProps = {
  userData: UserData | null
  foodEntries: FoodEntry[]
  weightLogs: WeightLog[]
}

export function PersonalizedFeedback({ userData, foodEntries, weightLogs }: PersonalizedFeedbackProps) {
  const generateFeedback = () => {
    const feedback = []

    if (!userData) {
      return ["Complete your profile to get personalized feedback"]
    }

    // BMI-based feedback
    if (userData.bmi) {
      if (userData.bmi < 18.5) {
        feedback.push("Consider increasing your calorie intake with nutrient-dense foods")
      } else if (userData.bmi >= 25 && userData.bmi < 30) {
        feedback.push("Focus on creating a moderate calorie deficit through diet and exercise")
      } else if (userData.bmi >= 30) {
        feedback.push("Consult with a healthcare provider for a comprehensive weight management plan")
      } else {
        feedback.push("Great job maintaining a healthy BMI! Keep up the good work")
      }
    }

    // Food intake feedback
    const totalCalories = foodEntries.reduce((sum, entry) => sum + entry.calories, 0)
    const totalSugar = foodEntries.reduce((sum, entry) => sum + entry.sugar, 0)
    const totalProtein = foodEntries.reduce((sum, entry) => sum + entry.protein, 0)

    if (foodEntries.length > 0) {
      if (totalSugar > 50) {
        feedback.push("Your sugar intake is high. Try reducing added sugars and processed foods")
      }
      if (totalProtein < 50) {
        feedback.push("Increase protein intake to support muscle maintenance and satiety")
      }
      if (totalCalories > (userData.dailyCalories || 2000) * 1.2) {
        feedback.push("You're consuming significantly more than your target. Consider portion control")
      }
    }

    // Activity level feedback
    if (userData.activityLevel === "sedentary") {
      feedback.push("Add 20-30 minutes of daily walking to boost your metabolism")
    }

    // Progress feedback
    if (weightLogs.length >= 2) {
      const first = weightLogs[weightLogs.length - 1].weight
      const last = weightLogs[0].weight
      const change = first - last

      if (change > 0) {
        feedback.push(`Excellent progress! You've lost ${change.toFixed(1)} kg. Keep it up!`)
      } else if (change < 0) {
        feedback.push("Your weight has increased. Review your diet and activity levels")
      }
    }

    return feedback.length > 0 ? feedback : ["Keep tracking your progress to get personalized insights"]
  }

  const getMotivationalMessage = () => {
    if (!userData) return "Start your health journey today!"

    const messages = [
      "Every healthy choice you make is a step towards a better you",
      "Consistency is key to achieving your health goals",
      "Small changes lead to big results over time",
      "Your health is an investment, not an expense",
      "Progress, not perfection, is what matters",
    ]

    return messages[Math.floor(Math.random() * messages.length)]
  }

  const feedback = generateFeedback()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-balance">Personalized Feedback</h2>
        <p className="text-sm md:text-base text-muted-foreground mt-2">AI-powered insights and recommendations</p>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Motivation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium text-balance">{getMotivationalMessage()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Personalized Tips
          </CardTitle>
          <CardDescription>Based on your current data and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {feedback.map((tip, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">{index + 1}</span>
                </div>
                <span className="text-foreground leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Progress Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weight Logs</span>
              <span className="font-semibold">{weightLogs.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Food Entries</span>
              <span className="font-semibold">{foodEntries.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current BMI</span>
              <span className="font-semibold">{userData?.bmi?.toFixed(1) || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">BMI Category</span>
              <span className="font-semibold">{userData?.bmiCategory || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-yellow-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userData && (
              <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xl">🎯</span>
                </div>
                <div>
                  <p className="font-semibold">Profile Complete</p>
                  <p className="text-sm text-muted-foreground">You've set up your health profile</p>
                </div>
              </div>
            )}
            {foodEntries.length >= 3 && (
              <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xl">🍎</span>
                </div>
                <div>
                  <p className="font-semibold">Food Tracker</p>
                  <p className="text-sm text-muted-foreground">Logged 3+ meals</p>
                </div>
              </div>
            )}
            {weightLogs.length >= 2 && (
              <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xl">📊</span>
                </div>
                <div>
                  <p className="font-semibold">Progress Tracker</p>
                  <p className="text-sm text-muted-foreground">Tracking your journey</p>
                </div>
              </div>
            )}
            {!userData && foodEntries.length === 0 && weightLogs.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Start tracking to unlock achievements!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
