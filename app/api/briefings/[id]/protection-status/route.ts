import { NextResponse } from "next/server"
import { getBriefingById } from "@/lib/briefings"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const briefing = await getBriefingById(params.id)

    if (!briefing) {
      return NextResponse.json({ error: "Briefing not found" }, { status: 404 })
    }

    return NextResponse.json({
      isProtected: !!briefing.viewer_password_hash,
    })
  } catch (error) {
    console.error("Error checking briefing protection status:", error)
    return NextResponse.json({ error: "Failed to check protection status" }, { status: 500 })
  }
}
