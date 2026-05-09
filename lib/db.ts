import { neon } from "@neondatabase/serverless"

let sql: ReturnType<typeof neon> | null = null
let isInitialized = false

function getSql() {
  if (!sql) {
    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
    if (!databaseUrl) {
      throw new Error("DATABASE_URL or POSTGRES_URL environment variable is required")
    }
    sql = neon(databaseUrl)
  }
  return sql
}

export async function initializeDatabase() {
  if (isInitialized) return

  const db = getSql()

  try {
    // Check if users table exists
    await db`SELECT 1 FROM users LIMIT 1`
    isInitialized = true
  } catch (error) {
    // Tables don't exist, create them
    console.log("[v0] Initializing database tables...")

    // Create users table
    await db`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create user profiles table
    await db`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        height DECIMAL(5,2),
        weight DECIMAL(5,2),
        age INTEGER,
        gender TEXT CHECK (gender IN ('male', 'female', 'other')),
        activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very-active')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create weight logs table
    await db`
      CREATE TABLE IF NOT EXISTS weight_logs (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        weight DECIMAL(5,2) NOT NULL,
        bmi DECIMAL(4,2) NOT NULL,
        log_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create food entries table
    await db`
      CREATE TABLE IF NOT EXISTS food_entries (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        calories INTEGER NOT NULL,
        protein DECIMAL(5,2) NOT NULL,
        carbs DECIMAL(5,2) NOT NULL,
        fat DECIMAL(5,2) NOT NULL,
        sugar DECIMAL(5,2) NOT NULL,
        image_url TEXT,
        entry_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create indexes
    await db`CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, log_date DESC)`
    await db`CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON food_entries(user_id, entry_date DESC)`

    // Insert default user
    await db`
      INSERT INTO users (id, email, password, name) 
      VALUES ('default-user-id', 'admin@nutritrack.com', 'admin123', 'Admin User')
      ON CONFLICT (email) DO NOTHING
    `

    console.log("[v0] Database initialized successfully!")
    isInitialized = true
  }
}

export { getSql as sql }
