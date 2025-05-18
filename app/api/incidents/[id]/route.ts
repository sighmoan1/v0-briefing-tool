import { NextResponse } from "next/server"
import { getIncidentById } from "@/lib/incidents"
import { cookies } from "next/headers"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const incident = await getIncidentById(params.id)

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 })
    }

    // Check if the incident is password-protected
    if (incident.is_sensitive) {
      // Check if the user has access via cookie
      const accessCookie = cookies().get(`incident_access_${params.id}`)

      if (!accessCookie) {
        // Don't return any incident details if not authorized
        return NextResponse.json({ error: "Unauthorized access" }, { status: 401 })
      }
    }

    return NextResponse.json(incident)
  } catch (error) {
    console.error("Error fetching incident:", error)
    return NextResponse.json({ error: "Failed to fetch incident" }, { status: 500 })
  }
}
