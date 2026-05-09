# NutriTrack - Local Setup Guide

## Prerequisites

- Node.js 18+ installed
- pnpm (recommended) or npm
- A Neon PostgreSQL database account (https://neon.tech)

## 1. Clone or Download the Project

Download the ZIP from v0 or clone from your GitHub repository.

```bash
cd v0-nutri-track-dashboard
```

## 2. Install Dependencies

```bash
pnpm install
# or
npm install
```

## 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
touch .env.local
```

Add the following environment variables:

```env
# Neon Database Connection String
# Get this from your Neon dashboard: https://console.neon.tech
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# JWT Secret for authentication (generate a random string)
# You can generate one using: openssl rand -base64 32
JWT_SECRET=your-secret-key-here-min-32-characters
```

### Getting Your Neon Database URL:

1. Go to https://console.neon.tech
2. Create a new project (or use existing)
3. Click on "Connection Details"
4. Copy the connection string (make sure to select "Pooled connection")

## 4. Set Up the Database

Run the SQL migrations to create the required tables:

```bash
# Option 1: Using psql (if installed)
psql $DATABASE_URL -f scripts/001_create_schema.sql
psql $DATABASE_URL -f scripts/002_add_test_users.sql

# Option 2: Using Neon Console
# 1. Go to your Neon project dashboard
# 2. Click "SQL Editor"
# 3. Copy and paste contents of scripts/001_create_schema.sql and run
# 4. Copy and paste contents of scripts/002_add_test_users.sql and run
```

### Database Schema Overview:

The app uses these tables:
- `users` - User accounts (email, password, name)
- `user_profiles` - User health data (height, weight, age, gender, activity level)
- `weight_logs` - Weight tracking history
- `food_entries` - Food intake logs

## 5. Run the Development Server

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 6. Test User Credentials

If you ran the `002_add_test_users.sql` script, you can use:

- **Email:** test@example.com
- **Password:** password123

Or create a new account using the Sign Up form.

## Project Structure

```
├── app/
│   ├── (auth)/sign-in/    # Login/Signup page
│   ├── actions/           # Server actions (auth, profile)
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard page
│   └── page.tsx           # Landing page (redirects to dashboard)
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── dashboard-client.tsx
│   ├── diet-recommendation.tsx
│   ├── food-analysis.tsx
│   ├── personalized-feedback.tsx
│   ├── progress-monitoring.tsx
│   ├── sidebar.tsx
│   └── user-data-form.tsx
├── lib/
│   ├── auth.ts            # JWT session management
│   ├── db.ts              # Database connection
│   └── utils.ts           # Utility functions
├── scripts/
│   ├── 001_create_schema.sql
│   └── 002_add_test_users.sql
└── .env.local             # Your environment variables (create this)
```

## Features

- User authentication (Sign In / Sign Up)
- BMI calculation and tracking
- Personalized diet plan based on BMI category
- Weight logging with history
- Progress monitoring with charts
- Responsive design (mobile-friendly)

## Troubleshooting

### "Invalid email or password" error
- Make sure you've run the database migrations
- Check if the user exists in the database
- Verify your DATABASE_URL is correct

### "Unauthorized" errors
- Check if JWT_SECRET is set in .env.local
- Clear browser cookies and try logging in again

### Database connection errors
- Verify your DATABASE_URL is correct
- Make sure your Neon project is active (free tier projects pause after inactivity)
- Check if SSL mode is enabled in the connection string

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** Neon PostgreSQL
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Authentication:** Custom JWT-based auth
