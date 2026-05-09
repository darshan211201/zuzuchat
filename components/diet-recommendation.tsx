import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { UserData } from "@/app/dashboard/page"
import { Apple, Beef, Wheat, Droplet, Sun, Coffee, Utensils, Moon, Cookie } from "lucide-react"

type DietRecommendationProps = {
  userData: UserData | null
}

// Sample meal plans based on BMI category
const MEAL_PLANS = {
  underweight: {
    breakfast: [
      { name: "Oatmeal with Banana & Nuts", calories: 450, protein: 12, carbs: 65, fat: 18 },
      { name: "Whole Grain Toast with Avocado", calories: 320, protein: 8, carbs: 35, fat: 18 },
      { name: "Greek Yogurt Parfait", calories: 380, protein: 18, carbs: 45, fat: 14 },
    ],
    lunch: [
      { name: "Grilled Chicken with Brown Rice", calories: 550, protein: 40, carbs: 55, fat: 16 },
      { name: "Salmon Quinoa Bowl", calories: 620, protein: 38, carbs: 48, fat: 28 },
      { name: "Turkey & Cheese Sandwich", calories: 580, protein: 35, carbs: 52, fat: 22 },
    ],
    dinner: [
      { name: "Beef Stir-Fry with Noodles", calories: 650, protein: 42, carbs: 58, fat: 26 },
      { name: "Pasta with Meat Sauce", calories: 680, protein: 35, carbs: 72, fat: 24 },
      { name: "Grilled Fish with Sweet Potato", calories: 520, protein: 38, carbs: 45, fat: 18 },
    ],
    snacks: [
      { name: "Trail Mix (1/4 cup)", calories: 180, protein: 5, carbs: 15, fat: 12 },
      { name: "Protein Smoothie", calories: 280, protein: 25, carbs: 30, fat: 6 },
      { name: "Cheese & Crackers", calories: 220, protein: 10, carbs: 18, fat: 12 },
    ],
  },
  normal: {
    breakfast: [
      { name: "Eggs with Whole Wheat Toast", calories: 350, protein: 18, carbs: 30, fat: 16 },
      { name: "Smoothie Bowl with Fruits", calories: 320, protein: 12, carbs: 48, fat: 8 },
      { name: "Greek Yogurt with Berries", calories: 280, protein: 20, carbs: 32, fat: 6 },
    ],
    lunch: [
      { name: "Grilled Chicken Salad", calories: 420, protein: 38, carbs: 22, fat: 20 },
      { name: "Tuna Wrap with Veggies", calories: 380, protein: 32, carbs: 35, fat: 12 },
      { name: "Quinoa Buddha Bowl", calories: 450, protein: 18, carbs: 52, fat: 18 },
    ],
    dinner: [
      { name: "Baked Salmon with Vegetables", calories: 480, protein: 42, carbs: 25, fat: 24 },
      { name: "Chicken Stir-Fry with Rice", calories: 520, protein: 35, carbs: 55, fat: 16 },
      { name: "Lean Steak with Salad", calories: 450, protein: 40, carbs: 15, fat: 26 },
    ],
    snacks: [
      { name: "Apple with Almond Butter", calories: 180, protein: 4, carbs: 22, fat: 10 },
      { name: "Greek Yogurt", calories: 100, protein: 17, carbs: 6, fat: 0 },
      { name: "Handful of Almonds", calories: 160, protein: 6, carbs: 6, fat: 14 },
    ],
  },
  overweight: {
    breakfast: [
      { name: "Egg White Omelette with Veggies", calories: 220, protein: 20, carbs: 8, fat: 12 },
      { name: "Overnight Oats with Berries", calories: 280, protein: 10, carbs: 42, fat: 8 },
      { name: "Cottage Cheese with Fruit", calories: 200, protein: 22, carbs: 18, fat: 4 },
    ],
    lunch: [
      { name: "Grilled Chicken Breast with Salad", calories: 350, protein: 40, carbs: 12, fat: 16 },
      { name: "Turkey Lettuce Wraps", calories: 280, protein: 28, carbs: 15, fat: 12 },
      { name: "Lentil Soup with Side Salad", calories: 320, protein: 18, carbs: 42, fat: 8 },
    ],
    dinner: [
      { name: "Baked Fish with Steamed Broccoli", calories: 380, protein: 38, carbs: 18, fat: 18 },
      { name: "Grilled Chicken with Roasted Veggies", calories: 400, protein: 42, carbs: 22, fat: 16 },
      { name: "Shrimp Stir-Fry (no rice)", calories: 320, protein: 32, carbs: 15, fat: 16 },
    ],
    snacks: [
      { name: "Celery with Hummus", calories: 80, protein: 3, carbs: 8, fat: 4 },
      { name: "Hard-Boiled Egg", calories: 78, protein: 6, carbs: 0, fat: 5 },
      { name: "Cucumber Slices", calories: 16, protein: 1, carbs: 3, fat: 0 },
    ],
  },
  obese: {
    breakfast: [
      { name: "Veggie Omelette (2 eggs)", calories: 180, protein: 14, carbs: 6, fat: 12 },
      { name: "Greek Yogurt (non-fat)", calories: 100, protein: 17, carbs: 6, fat: 0 },
      { name: "Smoothie with Spinach & Berries", calories: 150, protein: 8, carbs: 25, fat: 2 },
    ],
    lunch: [
      { name: "Large Garden Salad with Grilled Chicken", calories: 300, protein: 35, carbs: 15, fat: 12 },
      { name: "Vegetable Soup with Lean Protein", calories: 250, protein: 22, carbs: 20, fat: 8 },
      { name: "Grilled Fish with Steamed Vegetables", calories: 280, protein: 32, carbs: 12, fat: 12 },
    ],
    dinner: [
      { name: "Baked Chicken Breast with Salad", calories: 320, protein: 40, carbs: 10, fat: 14 },
      { name: "Grilled Salmon with Asparagus", calories: 350, protein: 38, carbs: 8, fat: 18 },
      { name: "Turkey Meatballs with Zucchini Noodles", calories: 300, protein: 32, carbs: 15, fat: 14 },
    ],
    snacks: [
      { name: "Raw Vegetables with Salsa", calories: 50, protein: 2, carbs: 10, fat: 0 },
      { name: "Small Apple", calories: 52, protein: 0, carbs: 14, fat: 0 },
      { name: "Sugar-Free Jello", calories: 10, protein: 1, carbs: 0, fat: 0 },
    ],
  },
}

export function DietRecommendation({ userData }: DietRecommendationProps) {
  if (!userData || !userData.bmi) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <Apple className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Please complete your profile first to get diet recommendations</p>
            <p className="text-sm text-muted-foreground mt-2">Go to Home tab and enter your details</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const calculateCalories = () => {
    const { weight, height, age, gender, activityLevel } = userData

    // Mifflin-St Jeor Equation
    let bmr = 10 * weight + 6.25 * height - 5 * age
    if (gender === "male") bmr += 5
    else if (gender === "female") bmr -= 161

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      "very-active": 1.9,
    }

    return Math.round(bmr * activityMultipliers[activityLevel])
  }

  const dailyCalories = calculateCalories()
  const protein = Math.round((dailyCalories * 0.3) / 4)
  const carbs = Math.round((dailyCalories * 0.4) / 4)
  const fats = Math.round((dailyCalories * 0.3) / 9)

  const getMealPlanCategory = () => {
    const bmi = userData.bmi!
    if (bmi < 18.5) return "underweight"
    if (bmi < 25) return "normal"
    if (bmi < 30) return "overweight"
    return "obese"
  }

  const mealPlanCategory = getMealPlanCategory()
  const mealPlan = MEAL_PLANS[mealPlanCategory]

  const getDietTips = () => {
    const bmi = userData.bmi!
    if (bmi < 18.5) {
      return [
        "Focus on nutrient-dense, calorie-rich foods",
        "Eat 5-6 smaller meals throughout the day",
        "Include healthy fats like nuts, avocados, and olive oil",
        "Add protein shakes between meals",
      ]
    } else if (bmi < 25) {
      return [
        "Maintain balanced meals with all macronutrients",
        "Stay hydrated with 8-10 glasses of water daily",
        "Include plenty of fruits and vegetables",
        "Keep portion sizes consistent",
      ]
    } else if (bmi < 30) {
      return [
        "Create a moderate calorie deficit (300-500 calories)",
        "Increase protein intake to preserve muscle mass",
        "Reduce refined carbs and added sugars",
        "Add more fiber-rich foods to stay full longer",
      ]
    } else {
      return [
        "Consult with a healthcare provider for personalized guidance",
        "Focus on whole, unprocessed foods",
        "Practice portion control and mindful eating",
        "Increase physical activity gradually",
      ]
    }
  }

  const MealCard = ({ 
    title, 
    icon: Icon, 
    meals, 
    time 
  }: { 
    title: string
    icon: React.ElementType
    meals: { name: string; calories: number; protein: number; carbs: number; fat: number }[]
    time: string 
  }) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <Badge variant="secondary">{time}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {meals.map((meal, index) => (
          <div key={index} className="p-3 bg-muted/50 rounded-lg">
            <p className="font-medium text-sm">{meal.name}</p>
            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
              <span>{meal.calories} kcal</span>
              <span>P: {meal.protein}g</span>
              <span>C: {meal.carbs}g</span>
              <span>F: {meal.fat}g</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-balance">Your Personalized Diet Plan</h2>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          Based on your BMI ({userData.bmi?.toFixed(1)}) - {userData.bmiCategory}
        </p>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
        <CardHeader>
          <CardTitle>Daily Calorie Target</CardTitle>
          <CardDescription>Recommended daily intake based on your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl md:text-5xl font-bold text-primary text-center py-4">
            {dailyCalories} <span className="text-xl md:text-2xl text-muted-foreground">kcal</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Beef className="h-5 w-5 text-red-500" />
              Protein
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{protein}g</div>
            <p className="text-sm text-muted-foreground mt-1">30% of daily calories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wheat className="h-5 w-5 text-yellow-600" />
              Carbs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{carbs}g</div>
            <p className="text-sm text-muted-foreground mt-1">40% of daily calories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Droplet className="h-5 w-5 text-blue-500" />
              Fats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fats}g</div>
            <p className="text-sm text-muted-foreground mt-1">30% of daily calories</p>
          </CardContent>
        </Card>
      </div>

      {/* Meal Plan Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold">Sample Meal Plan</h3>
          <p className="text-sm text-muted-foreground">Recommended meals for your BMI category - choose one option per meal</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <MealCard 
            title="Breakfast" 
            icon={Coffee} 
            meals={mealPlan.breakfast} 
            time="7:00 - 9:00 AM" 
          />
          <MealCard 
            title="Lunch" 
            icon={Sun} 
            meals={mealPlan.lunch} 
            time="12:00 - 2:00 PM" 
          />
          <MealCard 
            title="Dinner" 
            icon={Moon} 
            meals={mealPlan.dinner} 
            time="6:00 - 8:00 PM" 
          />
          <MealCard 
            title="Snacks" 
            icon={Cookie} 
            meals={mealPlan.snacks} 
            time="Between meals" 
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personalized Tips</CardTitle>
          <CardDescription>Recommendations based on your BMI category: {userData.bmiCategory}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {getDietTips().map((tip, index) => (
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
    </div>
  )
}
