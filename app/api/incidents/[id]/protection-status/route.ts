import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Only check if the incident exists and is protected, don't return any incident details
    const result = await sql`
      SELECT is_sensitive 
      FROM incidents 
      WHERE id = ${params.id}
    `

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 })
    }

    return NextResponse.json({
      isProtected: !!result[0].is_sensitive,
    })
  } catch (error) {
    console.error("Error checking incident protection status:", error)
    return NextResponse.json({ error: "Failed to check protection status" }, { status: 500 })
  }
}
