import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

// Directly use the environment variable without any conditional checks
// This ensures we're using the actual DATABASE_URL value
export const sql = neon(process.env.DATABASE_URL!)

// Log the connection attempt for debugging
console.log(
  "Database connection initialized with URL:",
  process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 15)}...` : "No DATABASE_URL provided",
)

// Create a database instance using drizzle
export const db = drizzle(sql)
