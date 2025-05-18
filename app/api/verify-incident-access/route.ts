import { NextResponse } from "next/server"
import { verifyIncidentAccess } from "@/lib/incidents"

export async function POST(request: Request) {
  try {
    const { incidentId, password } = await request.json()

    if (!incidentId || !password) {
      return NextResponse.json({ error: "Incident ID and password are required" }, { status: 400 })
    }

    const result = await verifyIncidentAccess(incidentId, password)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error verifying incident access:", error)
    return NextResponse.json({ success: false, error: "Failed to verify access" }, { status: 500 })
  }
}
