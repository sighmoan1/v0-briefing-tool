import { NextResponse } from "next/server"
import { getBriefingById } from "@/lib/briefings"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const briefing = await getBriefingById(params.id)

    if (!briefing) {
      return NextResponse.json({ error: "Briefing not found" }, { status: 404 })
    }

    // Return the briefing data for pre-population
    return NextResponse.json({
      success: true,
      briefing,
    })
  } catch (error) {
    console.error("Error fetching source briefing:", error)
    return NextResponse.json({ error: "Failed to fetch source briefing" }, { status: 500 })
  }
}
