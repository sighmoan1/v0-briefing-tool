import { NextResponse } from "next/server"
import { getBriefingById } from "@/lib/briefings"
import { cookies } from "next/headers"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const briefing = await getBriefingById(params.id)

    if (!briefing) {
      return NextResponse.json({ error: "Briefing not found" }, { status: 404 })
    }

    // Check if the briefing is password-protected
    if (briefing.viewer_password_hash) {
      // Check if the user has access via cookie
      const accessCookie = cookies().get(`briefing_access_${params.id}`)

      if (!accessCookie) {
        // Don't return any briefing details if not authorized
        return NextResponse.json({ error: "Unauthorized access" }, { status: 401 })
      }
    }

    // If we get here, the user is authorized to view the briefing
    return NextResponse.json(briefing)
  } catch (error) {
    console.error("Error fetching briefing:", error)
    return NextResponse.json({ error: "Failed to fetch briefing" }, { status: 500 })
  }
}
