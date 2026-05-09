"use client"

import { Home, Utensils, Camera, TrendingUp, MessageSquare, LogOut, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/actions/auth"
import { useState } from "react"

type SidebarProps = {
  activeTab: string
  setActiveTab: (tab: string) => void
  userName: string
}

export function Sidebar({ activeTab, setActiveTab, userName }: SidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "diet", label: "Diet Plan", icon: Utensils },
    { id: "food", label: "Food Analysis", icon: Camera },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setMobileMenuOpen(false)
  }

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">NutriTrack</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 w-64 border-r border-border bg-card p-6 flex flex-col transition-transform duration-300 ease-in-out",
          "md:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-8 hidden md:block">
          <h1 className="text-2xl font-bold text-primary">NutriTrack</h1>
          <p className="text-sm text-muted-foreground">Health & Nutrition</p>
        </div>

        <div className="mb-6 p-3 rounded-lg bg-primary/5 mt-16 md:mt-0">
          <p className="text-sm font-medium truncate">{userName}</p>
          <p className="text-xs text-muted-foreground">Tracking your health</p>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                  activeTab === item.id ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <Button variant="outline" className="w-full mt-4 bg-transparent" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </aside>
    </>
  )
}
