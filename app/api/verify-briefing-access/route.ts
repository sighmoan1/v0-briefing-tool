import { NextResponse } from "next/server"
import { verifyBriefingAccess } from "@/lib/briefings"

export async function POST(request: Request) {
  try {
    const { briefingId, password } = await request.json()

    if (!briefingId || !password) {
      return NextResponse.json({ error: "Briefing ID and password are required" }, { status: 400 })
    }

    const result = await verifyBriefingAccess(briefingId, password)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error verifying briefing access:", error)
    return NextResponse.json({ success: false, error: "Failed to verify access" }, { status: 500 })
  }
}
