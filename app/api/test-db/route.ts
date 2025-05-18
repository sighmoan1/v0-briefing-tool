import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getIncidents } from "@/lib/incidents"

export async function GET() {
  try {
    // Test basic connection
    const connectionTest = await sql`SELECT 1 as test`

    // Test incidents table existence
    const tableTest = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'incidents'
      ) as exists
    `

    // Get incidents
    const { incidents, total } = await getIncidents(1, 100)

    return NextResponse.json({
      success: true,
      connectionTest,
      tableExists: tableTest.rows[0]?.exists,
      incidents,
      total,
      databaseUrl: process.env.DATABASE_URL ? "Configured" : "Missing",
    })
  } catch (error) {
    console.error("Database test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
