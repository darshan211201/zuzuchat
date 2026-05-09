"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { UserData, WeightLog } from "@/app/dashboard/page"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Plus, TrendingDown, TrendingUp } from "lucide-react"

type ProgressMonitoringProps = {
  userData: UserData | null
  weightLogs: WeightLog[]
  addWeightLog: (log: WeightLog) => void
}

export function ProgressMonitoring({ userData, weightLogs, addWeightLog }: ProgressMonitoringProps) {
  const [showForm, setShowForm] = useState(false)
  const [newLog, setNewLog] = useState({ date: "", weight: 0 })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newLog.date && newLog.weight > 0 && userData) {
      const bmi = newLog.weight / Math.pow(userData.height / 100, 2)
      addWeightLog({
        date: newLog.date,
        weight: newLog.weight,
        bmi,
      })
      setNewLog({ date: "", weight: 0 })
      setShowForm(false)
    }
  }

  const getTrend = () => {
    if (!weightLogs || weightLogs.length < 2) return null
    const firstLog = weightLogs[weightLogs.length - 1]
    const lastLog = weightLogs[0]
    if (!firstLog?.weight || !lastLog?.weight) return null
    const change = lastLog.weight - firstLog.weight
    return {
      change: Math.abs(change).toFixed(1),
      direction: change < 0 ? "down" : "up",
    }
  }

  const trend = getTrend()

  const chartData = (weightLogs || []).filter(log => log && log.date).reverse().map((log) => ({
    ...log,
    date: log.date ? new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "-",
  }))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-balance">Progress Monitoring</h2>
        <p className="text-sm md:text-base text-muted-foreground mt-2">Track your weight and BMI changes over time</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userData?.weight || 0} kg</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current BMI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{userData?.bmi && typeof userData.bmi === 'number' ? userData.bmi.toFixed(1) : (userData?.bmi || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weight Change</CardTitle>
          </CardHeader>
          <CardContent>
            {trend ? (
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">{trend.change} kg</div>
                {trend.direction === "down" ? (
                  <TrendingDown className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingUp className="h-6 w-6 text-red-600" />
                )}
              </div>
            ) : (
              <div className="text-3xl font-bold text-muted-foreground">-</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Weight History</CardTitle>
              <CardDescription>Your weight changes over time</CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Log
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-border rounded-lg bg-muted/50">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newLog.date}
                    onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={newLog.weight || ""}
                    onChange={(e) => setNewLog({ ...newLog, weight: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" className="w-full sm:w-auto">
                  Add Log
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {weightLogs && weightLogs.length > 0 ? (
            <>
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Recent Logs</h4>
                <div className="space-y-2">
                  {weightLogs.slice(0, 5).map((log, index) => (
                    <div key={log.id || index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{log.date ? new Date(log.date).toLocaleDateString() : '-'}</p>
                        <p className="text-sm text-muted-foreground">BMI: {typeof log.bmi === 'number' ? log.bmi.toFixed(1) : log.bmi}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{log.weight} kg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No weight logs yet. Add your first entry to start tracking!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
