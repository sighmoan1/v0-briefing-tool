import { NextResponse } from "next/server"
import { getBriefings } from "@/lib/briefings"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get("page")) || 1
    const limit = Number(url.searchParams.get("limit")) || 10
    const search = url.searchParams.get("search") || ""

    const briefingsData = await getBriefings(params.id, page, limit, search)

    return NextResponse.json(briefingsData)
  } catch (error) {
    console.error("Error fetching briefings:", error)
    return NextResponse.json({ error: "Failed to fetch briefings" }, { status: 500 })
  }
}
